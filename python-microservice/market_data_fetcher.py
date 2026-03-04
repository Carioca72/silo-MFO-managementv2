import os
import requests
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# --- Configurações ---
BRAPI_TOKEN = os.getenv("BRAPI_TOKEN")
BRAPI_BASE_URL = "https://brapi.dev/api"
REQUEST_TIMEOUT = 15 # Timeout de 15 segundos para requisições externas

# --- Funções de Busca de Dados ---

def get_market_data(tickers: list):
    """
    Busca dados de mercado para uma lista de tickers, decidindo entre a API da Brapi e o yfinance.
    
    Retorna um dicionário onde a chave é o ticker e o valor são os dados enriquecidos.
    """
    results = {}
    for ticker in tickers:
        print(f"Buscando dados para o ticker: {ticker}")
        try:
            if '.SA' in ticker.upper(): # Heurística para identificar ativos brasileiros
                data = _fetch_brapi_data(ticker)
            else:
                data = _fetch_yfinance_data(ticker)
            
            if data:
                results[ticker] = data
            else:
                results[ticker] = {"error": "Não foi possível obter dados para este ticker."}
        except Exception as e:
            print(f"Erro ao processar o ticker {ticker}: {e}")
            results[ticker] = {"error": str(e)}
    return results


def _fetch_brapi_data(ticker: str):
    """
    Busca dados de um ativo brasileiro usando a API da Brapi.
    Calcula volatilidade e rentabilidade anualizadas.
    """
    if not BRAPI_TOKEN:
        raise ValueError("BRAPI_TOKEN não foi configurado nas variáveis de ambiente.")

    # 1. Obter dados históricos para cálculo
    response_hist = requests.get(
        f"{BRAPI_BASE_URL}/quote/{ticker}?range=1y&interval=1d&token={BRAPI_TOKEN}",
        timeout=REQUEST_TIMEOUT
    )
    response_hist.raise_for_status() # Lança exceção para erros HTTP
    hist_data = response_hist.json().get('results', [{}])[0].get('historicalDataPrice')

    if not hist_data:
        return None

    df = pd.DataFrame(hist_data)
    df['close'] = df['close'].astype(float)
    df['date'] = pd.to_datetime(df['date'], unit='s')
    df = df.set_index('date')

    # 2. Calcular Rentabilidade e Volatilidade Anualizadas
    daily_returns = df['close'].pct_change().dropna()
    annual_return = daily_returns.mean() * 252 # 252 dias de negociação no Brasil
    annual_volatility = daily_returns.std() * (252 ** 0.5)

    # 3. Obter dados atuais do ativo
    response_quote = requests.get(
        f"{BRAPI_BASE_URL}/quote/{ticker}?token={BRAPI_TOKEN}",
        timeout=REQUEST_TIMEOUT
    )
    response_quote.raise_for_status()
    quote_data = response_quote.json().get('results', [{}])[0]

    return {
        "source": "Brapi",
        "name": quote_data.get('longName'),
        "asset_class": quote_data.get('type', 'N/A'), # Simplificação, pode precisar de mais lógica
        "current_price": quote_data.get('regularMarketPrice'),
        "annual_return_pct": round(annual_return * 100, 2),
        "annual_volatility_pct": round(annual_volatility * 100, 2),
        "currency": quote_data.get('currency')
        # Outros campos como liquidez, taxas, etc., podem não estar disponíveis e precisarão ser adicionados manualmente ou de outra fonte
    }


def _fetch_yfinance_data(ticker: str):
    """
    Busca dados de um ativo internacional usando a biblioteca yfinance.
    Calcula volatilidade e rentabilidade anualizadas.
    """
    asset = yf.Ticker(ticker)

    # 1. Obter dados históricos
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    hist_data = asset.history(start=start_date, end=end_date)

    if hist_data.empty:
        return None

    # 2. Calcular Rentabilidade e Volatilidade Anualizadas
    daily_returns = hist_data['Close'].pct_change().dropna()
    annual_return = daily_returns.mean() * 252 
    annual_volatility = daily_returns.std() * (252 ** 0.5)

    # 3. Obter dados atuais
    info = asset.info

    return {
        "source": "yfinance",
        "name": info.get('longName'),
        "asset_class": info.get('quoteType', 'N/A'), # ex: EQUITY, ETF
        "current_price": info.get('regularMarketPrice', info.get('previousClose')),
        "annual_return_pct": round(annual_return * 100, 2),
        "annual_volatility_pct": round(annual_volatility * 100, 2),
        "currency": info.get('currency')
    }
