# python_microservice/core/data_retriever.py
import pandas as pd
from datetime import datetime, timedelta
from brasa.engine import MarketData
from bcb import sgs

# --- Funções de Enriquecimento de Ativos ---

def enrich_asset_data(assets: list) -> list:
    """
    Busca informações detalhadas para uma lista de ativos usando a biblioteca Brasa.
    Por enquanto, focaremos em fundos (via CNPJ) e ações.
    """
    # TODO: Implementar a lógica de busca com Brasa.
    # A lógica precisará de um try-except para buscar como fundo (CNPJ) e depois como ação (ticker).
    print("Data Retriever: A lógica de enriquecimento com a biblioteca 'brasa' será implementada aqui.")
    
    # Placeholder: Adiciona dados fictícios para demonstração
    for asset in assets:
        if asset.get("ticker") == "PETR4":
            asset["asset_class"] = "Ações"
            asset["long_name"] = "PETROLEO BRASILEIRO S.A."
        elif asset.get("ticker") == "VALE3":
            asset["asset_class"] = "Ações"
            asset["long_name"] = "VALE S.A."
        else:
            asset["asset_class"] = "Fundo Multimercado"
            asset["long_name"] = "FUNDO XYZ"

    return assets

# --- Funções de Busca de Dados de Mercado ---

def get_historical_exchange_rates(start_date: str, end_date: str, currency_code: int = 222) -> pd.DataFrame:
    """
    Busca a série histórica de taxas de câmbio (PTAX) do Banco Central do Brasil.
    O código 222 corresponde à "Taxa de câmbio - Dólar americano (venda)" - PTAX.
    """
    try:
        print(f"Buscando PTAX de {start_date} até {end_date}...")
        # O código 10813 refere-se à taxa de câmbio PTAX de venda diária
        ptax = sgs.get({'ptax': 10813}, start=start_date, end=end_date)
        ptax.rename(columns={"ptax": "exchange_rate"}, inplace=True)
        print("Busca de PTAX concluída.")
        return ptax

    except Exception as e:
        print(f"Erro ao buscar dados do BCB: {e}")
        # Retorna um DataFrame vazio em caso de erro para não quebrar o fluxo
        return pd.DataFrame()


# Exemplo de uso (para testes locais)
if __name__ == '__main__':
    # Teste de enriquecimento
    sample_assets = [
        {"ticker": "PETR4", "value": 50000},
        {"ticker": "00.306.278/0001-64", "value": 100000}, # Exemplo de CNPJ de fundo
    ]
    enriched = enrich_asset_data(sample_assets)
    print("--- Enriquecimento de Ativos ---")
    print(enriched)

    # Teste de busca de câmbio
    end_date_str = datetime.now().strftime('%Y-%m-%d')
    start_date_str = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    print("\n--- Busca de Taxa de Câmbio (PTAX) ---")
    exchange_rates_df = get_historical_exchange_rates(start_date_str, end_date_str)
    if not exchange_rates_df.empty:
        print(exchange_rates_df.head())
        print("...")
        print(exchange_rates_df.tail())
