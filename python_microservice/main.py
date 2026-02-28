# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import io

# --- Configuração do App ---
app = FastAPI(
    title="Silo MFO - Microserviço de Análise Quantitativa",
    description="Um serviço Python que oferece endpoints para extração de dados de extratos, otimização de portfólio (Markowitz), geração de gráficos e análise de performance.",
    version="0.1.0",
)

# --- Endpoints da API ---

@app.get("/", tags=["Health Check"])
async def root():
    """Endpoint de health check para verificar se o serviço está ativo."""
    return {"status": "ok", "service": "Python Analysis Microservice"}

@app.post("/api/v1/extract-and-analyze", tags=["Portfolio Analysis"])
async def extract_and_analyze(file: UploadFile = File(...)):
    """
    Recebe um arquivo (PDF ou CSV), extrai os ativos da carteira,
    enriquece os dados, otimiza o portfólio e retorna a análise completa.
    """
    # Validação do tipo de arquivo
    if file.content_type not in ["application/pdf", "text/csv"]:
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido. Por favor, envie um PDF ou CSV.")

    try:
        content = await file.read()
        
        # ETAPA 1: Extração de Dados (Lógica será implementada aqui)
        # ---------------------------------------------------------
        # if file.content_type == "application/pdf":
        #     # Usar pdfplumber para extrair texto e tabelas
        #     # Usar a IA (Groq) para interpretar o texto e estruturar os dados
        #     extracted_assets = ...
        # elif file.content_type == "text/csv":
        #     # Usar pandas para ler o CSV
        #     df = pd.read_csv(io.BytesIO(content))
        #     extracted_assets = ...

        # Placeholder - Simula dados extraídos
        extracted_assets = [
            {"ticker": "PETR4", "value": 50000},
            {"ticker": "VALE3", "value": 50000},
        ]
        # ---------------------------------------------------------

        # ETAPAS SEGUINTES (serão implementadas nas próximas fases):
        # 2. Enriquecer dados com a biblioteca `brasa`.
        # 3. Buscar séries históricas e converter para BRL com `python-bcb`.
        # 4. Otimizar com `PyPortfolioOpt` e gerar o gráfico da fronteira com `matplotlib`.
        # 5. Gerar textos narrativos com `groq`.

        return {
            "message": "Arquivo recebido. A extração e análise completa serão implementadas aqui.",
            "filename": file.filename,
            "extracted_data_placeholder": extracted_assets
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao processar o arquivo: {str(e)}")
