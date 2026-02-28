# python_microservice/main.py
import os
import io
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import pdfplumber
from groq import Groq

# --- Importações dos Módulos Core ---
from core.data_retriever import enrich_asset_data
from core.financial_engine import FinancialEngine
from core.diagnostics import run_diagnostics

# --- Configuração do App e Clientes ---
app = FastAPI(
    title="Silo MFO - Microserviço de Análise Quantitativa",
    version="0.2.0",
)
groq_client = Groq()

# --- Lógica de Extração com IA (helper) ---
def get_structured_data_from_text(text: str) -> list:
    # ... (a implementação desta função permanece a mesma)
    if not text.strip(): return []
    try:
        completion = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "Você é um assistente de análise financeira..."},
                {"role": "user", "content": f"Extraia os ativos do texto: {text}"}
            ],
            temperature=0, max_tokens=2048, top_p=1, stream=False, response_format={"type": "json_object"},
        )
        data = json.loads(completion.choices[0].message.content)
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, list): return value
        return data if isinstance(data, list) else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na IA: {e}")

# --- Endpoint Principal de Orquestração ---
@app.post("/api/v1/full-analysis", tags=["Portfolio Analysis"])
async def full_analysis_endpoint(file: UploadFile = File(...)):
    # ETAPA 0: Extração de Dados (PDF/CSV)
    content = await file.read()
    extracted_assets = []
    if file.content_type == "application/pdf":
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                full_text = "\n".join(p.extract_text() for p in pdf.pages if p.extract_text())
            if not full_text.strip(): raise HTTPException(status_code=400, detail="PDF vazio.")
            extracted_assets = get_structured_data_from_text(full_text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro no PDF: {e}")
    elif file.content_type in ["text/csv", "application/vnd.ms-excel"]:
        try:
            df = pd.read_csv(io.BytesIO(content))
            if 'ticker' not in df.columns or 'value' not in df.columns:
                raise HTTPException(status_code=400, detail="CSV deve ter colunas 'ticker' e 'value'.")
            extracted_assets = df[['ticker', 'value']].to_dict('records')
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro no CSV: {e}")
    else:
        raise HTTPException(status_code=400, detail=f"Tipo de arquivo inválido: {file.content_type}. Use PDF ou CSV.")

    if not extracted_assets:
        raise HTTPException(status_code=404, detail="Nenhum ativo encontrado no documento.")

    # ETAPA 1: Normalização e Enriquecimento de Dados
    current_portfolio_enriched = enrich_asset_data(extracted_assets)
    current_portfolio_df = pd.DataFrame(current_portfolio_enriched)
    total_value = current_portfolio_df['valor'].sum()
    current_portfolio_df['percentual_carteira'] = current_portfolio_df['valor'] / total_value

    # ETAPA 2 e 3: Projeção do Cenário ATUAL e Diagnóstico
    # (Market data vazia por enquanto, usando simulação do motor)
    engine_current = FinancialEngine(assets_data=current_portfolio_df.to_dict('records'), market_data=pd.DataFrame())
    projection_current = engine_current.run_projections(scenario_name="Atual")
    diagnostics_results = run_diagnostics(engine_current.portfolio_df)

    # ETAPA 4: Otimização para o NOVO Cenário
    # A otimização retorna uma lista de dicionários com a nova alocação
    new_portfolio_optimized_list = engine_current.optimize_portfolio()

    # ETAPA 5: Projeção do Cenário NOVO
    engine_new = FinancialEngine(assets_data=new_portfolio_optimized_list, market_data=pd.DataFrame())
    projection_new = engine_new.run_projections(scenario_name="Novo")

    # ETAPA 6: Montagem da Resposta Final
    return {
        "original_filename": file.filename,
        "diagnostics": diagnostics_results,
        "current_scenario": {
            "assets": engine_current.portfolio_df.to_dict('records'),
            "projection": projection_current,
        },
        "new_scenario": {
            "assets": engine_new.portfolio_df.to_dict('records'),
            "projection": projection_new,
        },
        "comparison_summary": {
            # Esta tabela comparativa é construída no frontend a partir dos dados de projeção
            # Mas podemos pré-calcular o delta para facilitar
            "delta_retorno_liquido": round(projection_new['aggregated_indicators']['retorno_liquido_total'] - projection_current['aggregated_indicators']['retorno_liquido_total'], 2),
            "delta_sharpe": round(projection_new['aggregated_indicators']['sharpe_ratio'] - projection_current['aggregated_indicators']['sharpe_ratio'], 2),
        }
    }
