import os
import asyncio
from dotenv import load_dotenv
from redis import from_url
from rq import Worker, Queue, Connection
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from wppconnect import Wppconnect

# Carregar variáveis de ambiente
load_dotenv()

# --- Configurações ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
WPP_SESSION_NAME = os.getenv("WPP_SESSION_NAME", "BOT_FINASSIST_WORKER")

# --- Gerenciamento da Conexão WhatsApp (Singleton para o Worker) ---
class WhatsAppWorkerClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WhatsAppWorkerClient, cls).__new__(cls)
            cls._instance.client = None
            cls._instance.status = "disconnected"
            cls._instance.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(cls._instance.loop)
            cls._instance.loop.run_until_complete(cls._instance.start_client())
        return cls._instance

    async def start_client(self):
        print(f"[Worker] Iniciando cliente WhatsApp para a sessão: {WPP_SESSION_NAME}")
        self.client = Wppconnect(session=WPP_SESSION_NAME, headless=True)
        self.client.start(status_callback=self.status_callback)
        while not self.client.is_connected():
            print("[Worker] Aguardando conexão do WhatsApp...")
            await asyncio.sleep(10)
        print("[Worker] Cliente WhatsApp conectado e pronto.")
        self.status = "connected"

    def status_callback(self, status, session):
        print(f"[Worker] Status do WhatsApp alterado: {status} para a sessão {session}")
        if status in ['notLogged', 'deviceNotConnected', 'browserClose']:
            self.status = "disconnected"

    def get_client(self):
        if self.client and self.client.is_connected():
            return self.client
        else:
            print("[Worker] ERRO: Cliente WhatsApp não está conectado no momento da tarefa.")
            raise ConnectionError("Cliente WhatsApp do Worker não está conectado.")

# --- Lazy Singleton Accessor for WhatsApp Client (Fix for B-16) ---
_wpp_worker_client = None

def get_wpp_worker_client():
    """Lazy initializes and returns the WhatsAppWorkerClient singleton."""
    global _wpp_worker_client
    if _wpp_worker_client is None:
        print("[Worker] First-time call: Initializing WhatsAppWorkerClient...")
        _wpp_worker_client = WhatsAppWorkerClient()
    return _wpp_worker_client

# --- Definição das Tarefas (Jobs) ---

def task_send_whatsapp_message(phone: str, message: str):
    """Tarefa que envia uma mensagem de texto via WhatsApp."""
    print(f"Processando tarefa: Enviar mensagem para {phone}")
    wpp_client = get_wpp_worker_client().get_client()
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(wpp_client.send_message(phone, message))
    print(f"Resultado do envio para {phone}: {result}")
    if result.get('ack', 0) <= 0:
        raise RuntimeError(f"Falha ao enviar mensagem para {phone}. ACK não recebido.")
    return result

def task_send_whatsapp_file(phone: str, file_path: str, filename: str):
    """Tarefa que envia um arquivo via WhatsApp."""
    print(f"Processando tarefa: Enviar arquivo {filename} para {phone}")
    wpp_client = get_wpp_worker_client().get_client()
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(wpp_client.send_file(phone, file_path, filename))
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Arquivo temporário {file_path} removido.")
    if result.get('ack', 0) <= 0:
        raise RuntimeError(f"Falha ao enviar arquivo para {phone}. ACK não recebido.")
    return result

def task_send_email(to_email: str, subject: str, html_content: str):
    """Tarefa que envia um e-mail via SendGrid."""
    print(f"Processando tarefa: Enviar e-mail para {to_email}")
    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        raise ValueError("SENDGRID_API_KEY ou SENDER_EMAIL não configurados para o worker.")
    
    message = Mail(from_email=SENDER_EMAIL, to_emails=to_email, subject=subject, html_content=html_content)
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        if not (200 <= response.status_code < 300):
            raise RuntimeError(f"Erro do SendGrid: {response.body}")
        print(f"E-mail enviado com sucesso para {to_email}")
        return {"status_code": response.status_code}
    except Exception as e:
        raise e

# --- Inicialização do Worker ---
if __name__ == '__main__':
    print("Iniciando o Worker de Comunicações...")
    listen = ['default']
    redis_conn = from_url(REDIS_URL)

    with Connection(redis_conn):
        worker = Worker(list(map(Queue, listen)))
        print(f"Worker escutando as filas: {listen}")
        worker.work()
