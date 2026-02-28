import os
import tempfile
import shutil
import re
from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from dotenv import load_dotenv
from redis import from_url
from rq import Queue
from pdf2image import convert_from_path
import pytesseract
from PIL import Image

# Módulos locais
import market_data_fetcher

# Carregar variáveis de ambiente
load_dotenv()

# --- Configurações ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# --- Conexão com a Fila Redis ---
redis_conn = from_url(REDIS_URL)
q = Queue('default', connection=redis_conn)

# --- Configuração da Aplicação FastAPI ---
app = FastAPI(
    title="FinAssist Data & Communication API",
    description="API para processamento de extratos (OCR), enriquecimento de dados de mercado e enfileiramento de tarefas.",
    version="3.0.0"
)

# --- Funções Auxiliares de OCR ---
def _extract_text_from_image(image_path):
    return pytesseract.image_to_string(Image.open(image_path), lang='por')

def _extract_text_from_pdf(pdf_path):
    images = convert_from_path(pdf_path)
    full_text = ""
    for image in images:
        full_text += _extract_text_from_image(image)
    return full_text

def _parse_assets_from_text(text):
    """
    Usa regex para encontrar ativos e valores no texto extraído.
    Esta é uma implementação de exemplo e precisaria ser muito mais robusta.
    """
    # Regex para encontrar tickers (ex: ABCD11, ABCD11.SA) e valores monetários (ex: R$ 12.345,67)
    # Esta é uma simplificação e o ponto mais frágil do processo.
    pattern = re.compile(r"([A-Z]{4}\d{1,2}(?:\.SA)?)\s+.*?R\$\s*([\d.,]+)", re.IGNORECASE | re.MULTILINE)
    found_assets = []
    for match in pattern.finditer(text):
        ticker = match.group(1).upper()
        value_str = match.group(2).replace('.', '').replace(',', '.')
        try:
            value = float(value_str)
            found_assets.append({"ticker": ticker, "invested_value": value})
        except ValueError:
            continue # Ignora valores mal formatados
            
    # Remove duplicatas se houver
    unique_assets = list({v['ticker']:v for v in found_assets}.values())
    return unique_assets


# --- Endpoints da API ---

@app.post("/api/process-statement", summary="Processa um extrato, extrai ativos via OCR e enriquece com dados de mercado")
async def process_statement(file: UploadFile = File(...)):
    # Salva o arquivo em um diretório temporário
    temp_dir = tempfile.mkdtemp()
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Extração de Texto (OCR)
        print(f"Iniciando processamento OCR para o arquivo: {file.filename}")
        text = ""
        if file.content_type == 'application/pdf':
            text = _extract_text_from_pdf(file_path)
        elif file.content_type in ['image/png', 'image/jpeg']:
            text = _extract_text_from_image(file_path)
        else:
            raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use PDF, PNG ou JPEG.")
        
        # 2. Parseamento do Texto para encontrar ativos
        print("Texto extraído, iniciando parseamento de ativos...")
        raw_assets = _parse_assets_from_text(text)
        if not raw_assets:
            raise HTTPException(status_code=404, detail="Nenhum ativo com formato reconhecível foi encontrado no documento.")

        tickers = [asset['ticker'] for asset in raw_assets]

        # 3. Enriquecimento de Dados de Mercado
        print(f"Ativos encontrados: {tickers}. Buscando dados de mercado...")
        market_data = market_data_fetcher.get_market_data(tickers)

        # 4. Combinação dos dados
        enriched_portfolio = []
        for asset in raw_assets:
            ticker = asset['ticker']
            data = market_data.get(ticker)
            if data and 'error' not in data:
                asset.update(data)
                enriched_portfolio.append(asset)
        
        total_invested = sum(a['invested_value'] for a in enriched_portfolio)

        # Adicionar % da carteira
        for asset in enriched_portfolio:
            asset['percentage_of_portfolio'] = round((asset['invested_value'] / total_invested) * 100, 2) if total_invested > 0 else 0

        return {
            "status": "succeeded",
            "portfolio": enriched_portfolio,
            "summary": {
                "total_invested": total_invested,
                "total_assets_found": len(raw_assets),
                "total_assets_enriched": len(enriched_portfolio)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro no processamento: {str(e)}")
    finally:
        # Limpa o diretório temporário
        shutil.rmtree(temp_dir)


# --- Endpoints antigos (agora legados ou para comunicação) ---
# [O código dos endpoints de enfileiramento de tarefas permanece aqui, sem alterações]
@app.post("/send-message", summary="Enfileira o envio de uma mensagem de texto via WhatsApp")
async def enqueue_send_message(data: dict = Body(...)):
    phone = data.get('phone')
    message = data.get('message')
    if not phone or not message:
        raise HTTPException(status_code=400, detail="Campos 'phone' e 'message' são obrigatórios.")

    try:
        job = q.enqueue('worker.task_send_whatsapp_message', phone, message)
        return {"status": "queued", "job_id": job.id, "details": f"Tarefa para enviar mensagem para {phone} foi enfileirada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enfileirar tarefa: {str(e)}")

@app.post("/send-file", summary="Enfileira o envio de um arquivo via WhatsApp")
async def enqueue_send_file(phone: str = Form(...), file: UploadFile = File(...)):
    try:
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        job = q.enqueue('worker.task_send_whatsapp_file', phone, file_path, file.filename)
        return {"status": "queued", "job_id": job.id, "details": f"Tarefa para enviar arquivo {file.filename} para {phone} foi enfileirada."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enfileirar tarefa de arquivo: {str(e)}")
    finally:
        await file.close()

@app.post("/send-email", summary="Enfileira o envio de um e-mail")
async def enqueue_send_email(data: dict = Body(...)):
    to_email = data.get('to_email')
    subject = data.get('subject')
    html_content = data.get('html_content')

    if not all([to_email, subject, html_content]):
        raise HTTPException(status_code=400, detail="Campos 'to_email', 'subject', e 'html_content' são obrigatórios.")

    try:
        job = q.enqueue('worker.task_send_email', to_email, subject, html_content)
        return {"status": "queued", "job_id": job.id, "details": f"Tarefa para enviar e-mail para {to_email} foi enfileirada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enfileirar tarefa de e-mail: {str(e)}")

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "API de Comunicação e Dados está operacional."}
