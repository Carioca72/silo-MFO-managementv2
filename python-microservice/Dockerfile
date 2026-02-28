# Usa uma imagem base do Python 3.9
FROM python:3.9-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# --- Instalação de Dependências do Sistema ---
# Atualiza o gerenciador de pacotes e instala o Tesseract OCR, Poppler (para pdf2image) e Git
RUN apt-get update && apt-get install -y tesseract-ocr poppler-utils git

# Copia o arquivo de dependências do Python para o container
COPY ./requirements.txt /app/requirements.txt

# Instala as dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código da aplicação para o diretório de trabalho
COPY . /app

# Expõe a porta 8000 para que a API FastAPI possa ser acessada
EXPOSE 8000

# Comando padrão para iniciar a aplicação quando o container for executado
# Inicia o servidor Uvicorn, tornando a API acessível
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
