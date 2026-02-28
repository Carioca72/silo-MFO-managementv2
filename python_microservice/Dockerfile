# python_microservice/Dockerfile

# 1. Usar uma imagem base oficial do Python.
FROM python:3.10-slim

# 2. Definir o diretório de trabalho dentro do container.
WORKDIR /app

# 3. Copiar o arquivo de dependências para o diretório de trabalho.
COPY requirements.txt .

# 4. Instalar as dependências. A flag --no-cache-dir reduz o tamanho da imagem.
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar o restante do código da aplicação para o diretório de trabalho.
COPY . .

# 6. Expor a porta que o FastAPI irá rodar (neste caso, 8000).
EXPOSE 8000

# 7. Comando para iniciar o servidor Uvicorn quando o container for iniciado.
#    --host 0.0.0.0 permite que o servidor seja acessível de fora do container.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
