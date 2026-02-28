# main.py
import os
import io
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import pdfplumber
from groq import Groq

# Importações dos módulos core
from core.data_retriever import enrich_asset_data, get_historical_exchange_rates

# --- Configuração do App e Clientes ---
app = FastAPI(
    title="Silo MFO - Microserviço de Análise Quantitativa",
    description="Um serviço Python que oferece endpoints para extração de dados de extratos, otimização de portfólio (Markowitz), geração de gráficos e análise de performance.",
    version="0.1.0",
)

groq_client = Groq()

# --- Lógica de Extração com IA ---
def get_structured_data_from_text(text: str) -> list:
    # (Lógica de extração com Groq - sem alterações)
    if not text.strip():
        return []
    try:
        completion = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": """Você é um assistente de análise financeira... (conforme definido anteriormente)"""
                },
                {
                    "role": "user",
                    "content": f"""Por favor, extraia os ativos do seguinte texto...\n--- INÍCIO DO TEXTO ---\n{text}\n--- FIM DO TEXTO ---"""
                }
            ],
            temperature=0, max_tokens=2048, top_p=1, stream=False, response_format={"type": "json_object"},
        )
        response_text = completion.choices[0].message.content
        data = json.loads(response_text)
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, list):
                    return value
        elif isinstance(data, list):
            return data
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na IA ao processar o texto: {e}")

# --- Endpoints da API ---

@app.get("/", tags=["Health Check"])
async def root():
    return {"status": "ok", "service": "Python Analysis Microservice"}

@app.post("/api/v1/extract-and-analyze", tags=["Portfolio Analysis"])
async def extract_and_analyze(file: UploadFile = File(...)):
    # 1. Extração de Dados (PDF/CSV)
    content = await file.read()
    extracted_assets = []
    # ... (lógica de extração if/elif para PDF/CSV - sem alterações)
    if file.content_type == "application/pdf":
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                full_text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
            if not full_text.strip():
                raise HTTPException(status_code=400, detail="PDF vazio.")
            extracted_assets = get_structured_data_from_text(full_text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro no PDF: {str(e)}")
    elif file.content_type == "text/csv":
        #... (lógica para CSV)
        pass # Adicionar a lógica de leitura do CSV
    else:
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido.")

    if not extracted_assets:
        raise HTTPException(status_code=404, detail="Nenhum ativo encontrado.")

    # 2. Enriquecimento dos Dados
    enriched_assets = enrich_asset_data(extracted_assets)

    # ETAPAS FUTURAS:
    # 3. Otimizar com `PyPortfolioOpt`.
    # 4. Gerar gráficos e textos.

    return {
        "message": "Extração e enriquecimento concluídos.",
        "filename": file.filename,
        "enriched_assets": enriched_assets # Retorna os dados enriquecidos
    }
