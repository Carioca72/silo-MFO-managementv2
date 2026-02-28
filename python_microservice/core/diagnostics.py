# python_microservice/core/diagnostics.py
import pandas as pd

# --- Motor de Diagnóstico Automático ---

def run_diagnostics(portfolio_df: pd.DataFrame) -> list:
    """
    Executa uma série de verificações de diagnóstico na carteira e retorna uma lista de alertas.
    
    :param portfolio_df: DataFrame do pandas contendo a carteira atual enriquecida.
    :return: Uma lista de strings, onde cada string é um alerta de diagnóstico.
    """
    alerts = []
    
    # Regra 1: Concentração (Oversized)
    # Se algum ativo > 20% da carteira
    concentrated_assets = portfolio_df[portfolio_df['percentual_carteira'] > 0.20]
    if not concentrated_assets.empty:
        for _, asset in concentrated_assets.iterrows():
            asset_name = asset.get('titulo', asset.get('ticker', 'Um ativo'))
            percent = asset['percentual_carteira'] * 100
            alerts.append(
                f"[CONCENTRAÇÃO] Carteira apresenta concentração excessiva ({percent:.1f}%) em '{asset_name}'."
            )

    # Regra 2: Liquidez
    # Se ativos com liquidez diária > 40%
    # Assumimos que liquidez_dias <= 1 significa liquidez diária.
    daily_liquidity_percent = portfolio_df[portfolio_df['liquidez_dias'] <= 1]['percentual_carteira'].sum()
    if daily_liquidity_percent > 0.40:
        percent = daily_liquidity_percent * 100
        alerts.append(
            f"[LIQUIDEZ] Elevada exposição em liquidez diária ({percent:.1f}%) pode dificultar a superação do CDI no longo prazo."
        )
        
    # Regra 3: Emissor Único (Single Name)
    # Se houver múltiplos ativos do mesmo emissor/instituição
    # Usamos a coluna 'instituicao' que foi enriquecida pelo data_retriever
    issuer_counts = portfolio_df.groupby('instituicao').size()
    conflicted_issuers = issuer_counts[issuer_counts > 1]
    if not conflicted_issuers.empty:
        for issuer, count in conflicted_issuers.items():
            alerts.append(
                f"[DIVERSIFICAÇÃO] Carteira possui {count} ativos da instituição '{issuer}', indicando potencial concentração em um único gestor ou emissor."
            )

    if not alerts:
        alerts.append("[OK] A carteira atual parece bem diversificada e alinhada com as boas práticas de mercado.")

    return alerts

# Exemplo de uso (para testes locais)
if __name__ == '__main__':
    # Dados de exemplo simulando uma carteira com problemas
    sample_portfolio_data = {
        'ticker': ['ATIVO_A', 'ATIVO_B', 'ATIVO_C', 'ATIVO_D'],
        'valor': [25000, 50000, 15000, 10000],
        'instituicao': ['GESTOR X', 'GESTOR Y', 'GESTOR X', 'BANCO Z'],
        'liquidez_dias': [0, 30, 1, 90],
    }
    sample_df = pd.DataFrame(sample_portfolio_data)
    total_value = sample_df['valor'].sum()
    sample_df['percentual_carteira'] = sample_df['valor'] / total_value

    print("--- Executando Diagnóstico em Carteira de Exemplo ---")
    found_alerts = run_diagnostics(sample_df)
    for alert in found_alerts:
        print(f"- {alert}")
