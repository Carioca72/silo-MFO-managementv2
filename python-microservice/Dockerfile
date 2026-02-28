# Usar uma imagem oficial do Python como base
FROM python:3.9-slim

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar o arquivo de dependências para o diretório de trabalho
COPY requirements.txt ./

# Instalar as dependências definidas no requirements.txt
# O --no-cache-dir garante que não haverá cache desnecessário, mantendo a imagem leve
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo o código da aplicação para o diretório de trabalho
COPY . .

# Expor a porta 8000, que é a porta padrão do FastAPI/Uvicorn
EXPOSE 8000

# Comando para iniciar a aplicação quando o container for executado
# Ele inicia o servidor Uvicorn, apontando para o objeto 'app' no arquivo 'main.py'
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
