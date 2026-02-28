import os
import tempfile
import shutil
from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from dotenv import load_dotenv
from redis import from_url
from rq import Queue

# Carregar variáveis de ambiente
load_dotenv()

# --- Configurações ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# --- Conexão com a Fila Redis ---
redis_conn = from_url(REDIS_URL)
# A fila 'default' é onde o nosso worker.py está escutando por tarefas
q = Queue('default', connection=redis_conn)

# --- Configuração da Aplicação FastAPI ---
app = FastAPI(
    title="Communication Microservice API",
    description="API para enfileirar tarefas de comunicação (WhatsApp & E-mail).",
    version="2.0.0" # Major version bump para refletir a nova arquitetura com filas
)

# --- Endpoints da API (Agora apenas para enfileirar tarefas) ---

@app.get("/", summary="Status da API")
async def root():
    return {"message": "API de Comunicação está operacional. Use os endpoints para enfileirar tarefas."}

@app.post("/send-message", summary="Enfileira o envio de uma mensagem de texto via WhatsApp")
async def enqueue_send_message(data: dict = Body(...)):
    phone = data.get('phone')
    message = data.get('message')
    if not phone or not message:
        raise HTTPException(status_code=400, detail="Campos 'phone' e 'message' são obrigatórios.")

    try:
        # Enfileira a tarefa para ser executada pelo worker.py
        # 'worker.task_send_whatsapp_message' é a referência da função no outro script
        job = q.enqueue('worker.task_send_whatsapp_message', phone, message)
        return {"status": "queued", "job_id": job.id, "details": f"Tarefa para enviar mensagem para {phone} foi enfileirada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enfileirar tarefa: {str(e)}")

@app.post("/send-file", summary="Enfileira o envio de um arquivo via WhatsApp")
async def enqueue_send_file(phone: str = Form(...), file: UploadFile = File(...)):
    # Salva o arquivo em um local temporário que o worker possa acessar
    # Nota: Em um sistema distribuído real, usaríamos um storage compartilhado como S3.
    # Para este projeto com volumes Docker, um diretório compartilhado funciona.
    try:
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Enfileira a tarefa com o caminho do arquivo temporário
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
        # Enfileira a tarefa de e-mail
        job = q.enqueue('worker.task_send_email', to_email, subject, html_content)
        return {"status": "queued", "job_id": job.id, "details": f"Tarefa para enviar e-mail para {to_email} foi enfileirada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enfileirar tarefa de e-mail: {str(e)}")

# Os endpoints de status e QR code do WhatsApp foram removidos da API principal,
# pois a conexão agora é gerenciada exclusivamente pelo worker em background.
# Uma API de monitoramento mais avançada poderia ser criada para expor o status do worker.
