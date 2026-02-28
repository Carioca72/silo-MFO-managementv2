# python_microservice/core/data_retriever.py
import os
import re
from datetime import datetime, timedelta
import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from brapi import Brapi
from bcb import sgs

# --- Configuração Inicial ---
load_dotenv()

# Inicializa o cliente Brapi de forma síncrona
# A chave é lida do arquivo .env (BRAPI_API_KEY)
brapi_client = Brapi()

# --- Funções de Busca de Dados de Mercado (Histórico) ---
def get_market_data(tickers: list, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Busca o histórico de preços de fechamento ajustado para uma lista de tickers usando yfinance.
    O yfinance ajusta automaticamente os tickers para o formato do Yahoo Finance (ex: PETR4 -> PETR4.SA).
    """
    print(f"Buscando dados históricos de mercado para: {tickers}")
    try:
        # O yfinance lida com múltiplos tickers e já faz o mapeamento para o padrão ".SA" para ações brasileiras
        data = yf.download(tickers, start=start_date, end=end_date)['Adj Close']
        if data.empty:
            print("Aviso: Nenhum dado de mercado retornado pelo yfinance.")
            return pd.DataFrame()
        return data
    except Exception as e:
        print(f"Erro ao buscar dados de mercado com yfinance: {e}")
        return pd.DataFrame()

# --- Funções de Enriquecimento de Ativos (Dados Atuais) ---
def enrich_asset_data(assets: list) -> list:
    """
    Usa uma estratégia de múltiplos provedores (Brapi, yfinance) para enriquecer uma lista de ativos.
    """
    print("Iniciando enriquecimento de dados de ativos...")
    enriched_assets = []
    tickers = [asset['ticker'] for asset in assets if isinstance(asset.get('ticker'), str) and not re.match(r'\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}', asset['ticker'])]

    # 1. Enriquecimento em lote com Brapi para ativos brasileiros
    if tickers:
        try:
            # A Brapi aceita múltiplos tickers separados por vírgula
            brapi_quotes = brapi_client.quote.retrieve(tickers=",".join(tickers))
            
            for quote in brapi_quotes.results:
                asset = next((a for a in assets if a['ticker'] == quote.symbol), None)
                if asset:
                    enriched_assets.append({
                        "instituicao": quote.long_name or "Não informado",
                        "classe": "AÇÕES", # Brapi foca em ações
                        "titulo": f"{quote.symbol} - {quote.short_name}",
                        "liquidez_dias": 1, # Ações geralmente têm liquidez D+1/D+2
                        "estrategia": "RENDA VARIÁVEL",
                        "valor": asset['value'],
                        "tributacao": 0.15, # Alíquota padrão para swing trade
                        "tx_adm_aa": 0.0, # Ações não possuem taxa de adm
                        "ret_cdi_12m": None, # Não aplicável diretamente a ações
                        "volatilidade_12m": quote.two_hundred_day_average_change_percent, # Proxy de volatilidade
                        "rebalanceamento": "MANTER"
                    })
        except Exception as e:
            print(f"Erro ao buscar dados da Brapi: {e}. Tentando fontes alternativas.")
    
    # 2. Lógica de Fallback ou para ativos não encontrados/internacionais com yfinance
    # (A ser implementado se necessário - yfinance é mais focado em dados históricos)

    # 3. Tratamento para CNPJs de Fundos (ainda como placeholder, aguardando Brasa)
    fund_cnpjs = [asset['ticker'] for asset in assets if re.match(r'\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}', asset.get('ticker',''))]
    if fund_cnpjs:
        print(f"Aviso: Enriquecimento para Fundos (CNPJs: {fund_cnpjs}) ainda é simulado.")
        for cnpj in fund_cnpjs:
            asset = next((a for a in assets if a['ticker'] == cnpj), None)
            if asset:
                 enriched_assets.append({
                    "instituicao": "GESTORA EXEMPLO LTDA",
                    "classe": "FUNDO MULTIMERCADO",
                    "titulo": f"FUNDO EXEMPLO {cnpj}",
                    "liquidez_dias": 30,
                    "estrategia": "MULTIMERCADO",
                    "valor": asset['value'],
                    "tributacao": 0.15,
                    "tx_adm_aa": 0.02,
                    "ret_cdi_12m": 1.15,
                    "volatilidade_12m": 0.08,
                    "rebalanceamento": "MANTER"
                })

    print(f"Enriquecimento concluído. {len(enriched_assets)} ativos processados.")
    return enriched_assets

# --- Funções de Busca de Taxa de Câmbio ---
def get_historical_exchange_rates(start_date: str, end_date: str) -> pd.DataFrame:
    """
    Busca a série histórica de taxas de câmbio PTAX (venda) do Banco Central.
    """
    try:
        print(f"Buscando PTAX de {start_date} até {end_date}...")
        ptax = sgs.get({'ptax': 10813}, start=start_date, end=end_date)
        ptax.rename(columns={"ptax": "exchange_rate"}, inplace=True)
        print("Busca de PTAX concluída.")
        return ptax
    except Exception as e:
        print(f"Erro ao buscar dados do BCB: {e}")
        return pd.DataFrame()
