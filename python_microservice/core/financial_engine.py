# python_microservice/core/financial_engine.py
import pandas as pd
import numpy as np
from pypfopt import EfficientFrontier, risk_models, expected_returns

# --- Motor de Cálculo Financeiro ---

class FinancialEngine:
    def __init__(self, assets_data: list, market_data: pd.DataFrame):
        self.assets_data = assets_data
        self.market_data = market_data
        self.portfolio_df = self._create_portfolio_dataframe()

    def _create_portfolio_dataframe(self) -> pd.DataFrame:
        df = pd.DataFrame(self.assets_data)
        if 'valor' not in df.columns or df['valor'].sum() == 0:
            # Se não houver valor, não podemos calcular percentuais
            df['percentual_carteira'] = 0
        else:
            total_value = df['valor'].sum()
            df['percentual_carteira'] = df['valor'] / total_value
        return df

    def run_projections(self, scenario_name: str) -> dict:
        # ... (lógica de projeção simulada permanece a mesma por enquanto) ...
        print(f"Motor Financeiro: Executando projeções para o cenário '{scenario_name}'.")
        projection_data = []
        saldo_inicial = self.portfolio_df['valor'].sum()
        # Simulação simples de retorno e custo
        retorno_mensal_simulado = 0.008 # 0.8% a.m.
        custo_mensal_simulado = 0.001 # 0.1% a.m.
        ir_simulado = 0.15 # 15%

        for mes in range(1, 13):
            retorno_nominal = saldo_inicial * retorno_mensal_simulado
            custo = saldo_inicial * custo_mensal_simulado
            retorno_bruto = retorno_nominal - custo
            ir_estimado = (retorno_bruto * ir_simulado) if retorno_bruto > 0 else 0
            retorno_liquido = retorno_bruto - ir_estimado
            saldo_final = saldo_inicial + retorno_liquido
            
            projection_data.append({
                "mes": mes, "saldo_inicial": round(saldo_inicial, 2),
                "retorno_nominal": round(retorno_nominal, 2), "custo_mensal": round(custo, 2),
                "retorno_bruto": round(retorno_bruto, 2), "ir_estimado": round(ir_estimado, 2),
                "retorno_liquido": round(retorno_liquido, 2), "saldo_final": round(saldo_final, 2),
            })
            saldo_inicial = saldo_final

        return {
            "projection_data": projection_data,
            "aggregated_indicators": self._calculate_aggregated_indicators(projection_data)
        }

    def _calculate_aggregated_indicators(self, projection_data: list) -> dict:
        # ... (lógica de cálculo de indicadores agregados permanece a mesma) ...
        df = pd.DataFrame(projection_data)
        total_retorno_liquido = df['retorno_liquido'].sum()
        saldo_inicial_total = df['saldo_inicial'].iloc[0]
        retorno_percentual_periodo = (total_retorno_liquido / saldo_inicial_total) if saldo_inicial_total else 0
        # Placeholder para indicadores que dependem de dados reais
        # A volatilidade e o Sharpe virão do cálculo real do PyPortfolioOpt
        volatilidade_anual, sharpe = self.get_portfolio_performance()

        return {
            "retorno_nominal_total": round(df['retorno_nominal'].sum(), 2),
            "custos_totais": round(df['custo_mensal'].sum(), 2),
            "ir_total": round(df['ir_estimado'].sum(), 2),
            "retorno_liquido_total": round(total_retorno_liquido, 2),
            "retorno_percentual_periodo": round(retorno_percentual_periodo * 100, 2),
            "retorno_percentual_mes": round(((1 + retorno_percentual_periodo)**(1/12) - 1) * 100, 2),
            "retorno_cdi": 110.0, # Placeholder
            "volatilidade": round(volatilidade_anual * 100, 2),
            "sharpe_ratio": round(sharpe, 2),
        }

    def get_portfolio_performance(self):
        """Calcula a volatilidade e o sharpe do portfólio com base nos pesos atuais e dados de mercado."""
        if self.market_data.empty or self.market_data.shape[1] < 2:
            return 0.08, 1.2 # Retorna valores de placeholder se não houver dados
        
        try:
            mu = expected_returns.mean_historical_return(self.market_data)
            S = risk_models.sample_cov(self.market_data)
            # Mapeia os pesos atuais para a ordem dos tickers do market_data
            weights = self.portfolio_df.set_index('titulo')['percentual_carteira']
            # PyPortfolioOpt espera os títulos no formato yfinance (ex: 'PETR4.SA')
            # Nosso 'titulo' já tem esse formato, ex: 'PETR4 - PETROBRAS PN'
            # Vamos extrair o ticker do título
            ticker_map = {col: col.split(' - ')[0] for col in self.market_data.columns}
            weights.index = weights.index.map(lambda x: x.split(' - ')[0])
            weights = weights.reindex(ticker_map.keys()).fillna(0).values

            portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(S, weights))) * np.sqrt(252)
            sharpe = (mu.dot(weights) * 252) / portfolio_volatility
            return portfolio_volatility, sharpe
        except Exception as e:
            print(f"Erro ao calcular performance da carteira: {e}")
            return 0.08, 1.2 # Fallback

    def optimize_portfolio(self):
        """
        Usa PyPortfolioOpt para encontrar a carteira otimizada (Máximo Sharpe).
        """
        # Se não houver dados de mercado ou menos de 2 ativos, a otimização não é possível.
        if self.market_data.empty or self.market_data.shape[1] < 2:
            print("Aviso: Otimização não executada. Dados de mercado insuficientes.")
            return self.portfolio_df.to_dict('records') # Retorna a carteira original

        print("Motor Financeiro: Otimizando portfólio com PyPortfolioOpt e dados reais.")
        try:
            # 1. Calcular retornos esperados e matriz de covariância
            mu = expected_returns.mean_historical_return(self.market_data)
            S = risk_models.sample_cov(self.market_data)

            # 2. Otimizar para o máximo índice de Sharpe
            ef = EfficientFrontier(mu, S)
            weights = ef.max_sharpe()
            cleaned_weights = ef.clean_weights()
            
            print("Pesos Otimizados:", cleaned_weights)
            ef.portfolio_performance(verbose=True)

            # 3. Construir o novo portfólio com os pesos otimizados
            novo_portfolio_df = self.portfolio_df.copy()
            total_value = novo_portfolio_df['valor'].sum()
            # Mapeia os pesos (que estão por ticker) para o DataFrame do portfólio
            weight_map = {ticker: weight for ticker, weight in cleaned_weights.items()}
            
            # Extrai o ticker do título para fazer o mapeamento correto
            novo_portfolio_df['ticker_only'] = novo_portfolio_df['titulo'].apply(lambda x: x.split(' - ')[0])

            novo_portfolio_df['percentual_carteira'] = novo_portfolio_df['ticker_only'].map(weight_map).fillna(0)
            novo_portfolio_df['valor'] = novo_portfolio_df['percentual_carteira'] * total_value
            
            return novo_portfolio_df.drop(columns=['ticker_only']).to_dict('records')

        except Exception as e:
            print(f"ERRO CRÍTICO na otimização do portfólio: {e}")
            print("Fallback: retornando a carteira original como novo cenário.")
            return self.portfolio_df.to_dict('records')
