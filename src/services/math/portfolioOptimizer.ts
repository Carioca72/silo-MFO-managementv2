
import * as math from 'mathjs';
import { AssetData } from '../market/dataFetcher.js';
import { marketDataAggregator } from '../market/marketDataAggregator.js';
import { bacenIntegration } from '../../services/integration/bacenIntegration.js';
// REMOVIDO: a função fillMissingData não será mais usada.
import { createPriceMatrix } from '../../utils/dataUtils.js';

export interface PortfolioScenario {
  name: string;
  weights: { [ticker: string]: number };
  performance: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
}

export class PortfolioOptimizer {
  
  /**
   * Calculates daily returns from price history
   */
  private calculateReturns(history: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      // Adicionada validação para evitar divisão por zero se o preço anterior for 0
      if (history[i - 1] === 0) {
          returns.push(0);
      } else {
          returns.push((history[i] - history[i - 1]) / history[i - 1]);
      }
    }
    return returns;
  }

  /**
   * Calculates annualized mean return and standard deviation
   */
  private calculateStats(returns: number[]): { mean: number; std: number } {
    if (returns.length === 0) return { mean: 0, std: 0 };
    const mean = math.mean(returns) as unknown as number;
    const std = math.std(returns) as unknown as number;
    return {
      mean: mean * 12, // Annualized (Monthly data * 12)
      std: std * Math.sqrt(12) // Annualized (Monthly data * sqrt(12))
    };
  }

  /**
   * Calculates covariance matrix (annualized)
   */
  private calculateCovariance(assetsReturns: number[][]): number[][] {
    const n = assetsReturns.length;
    // Lógica de alinhamento removida - a validação prévia garantirá dados consistentes.
    const minLen = assetsReturns[0].length;
        
    const covMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const meanI = math.mean(assetsReturns[i]) as unknown as number;
        const meanJ = math.mean(assetsReturns[j]) as unknown as number;
        let sum = 0;
        for (let k = 0; k < minLen; k++) {
          sum += (assetsReturns[i][k] - meanI) * (assetsReturns[j][k] - meanJ);
        }
        // Validação de Divisão por Zero
        if (minLen - 1 <= 0) {
            throw new Error(`Cálculo de covariância inválido: número de pontos de dados (${minLen}) é insuficiente.`);
        }
        const covariance = (sum / (minLen - 1)) * 12; // Annualized (Monthly)
        
        // Validação de NaN/Infinity no resultado
        if (!isFinite(covariance)) {
            throw new Error(`Erro matemático no cálculo da covariância para o par de ativos [${i},${j}]. Resultado: ${covariance}`);
        }
        covMatrix[i][j] = covariance;
      }
    }
    return covMatrix;
  }

  public async optimize(assets: AssetData[], riskFreeRate: number, targetReturn: number = 0.15): Promise<PortfolioScenario[]> {
    // 1. Fetch Monthly Data
    const tickers = assets.map(a => a.ticker);
    const monthlyQuotes = await marketDataAggregator.getMonthlyQuotes(tickers);
    
    // 2. Validação de Dados ("Gatekeeper")
    const MINIMUM_REQUIRED_MONTHS = 36;
    for (const asset of assets) {
        const assetData = monthlyQuotes.find(q => q.ticker === asset.ticker);
        const historyLength = assetData?.history.length || 0;
        if (historyLength < MINIMUM_REQUIRED_MONTHS) {
            throw new Error(`Otimização abortada: O ativo '${asset.ticker}' possui apenas ${historyLength} meses de histórico. O mínimo requerido é ${MINIMUM_REQUIRED_MONTHS}.`);
        }
    }

    // 3. Criar Matriz de Preços (sem preenchimento de dados)
    const priceMatrix = createPriceMatrix(monthlyQuotes);
    // REMOVIDO: const filledPrices = fillMissingData(priceMatrix);

    // 4. Calcular Retornos
    const orderedReturns: number[][] = [];
    assets.forEach(asset => {
        const prices = priceMatrix[asset.ticker];
        // A validação do Gatekeeper garante que prices existe e tem comprimento suficiente.
        orderedReturns.push(this.calculateReturns(prices));
    });

    // Validação Pós-Cálculo de Retornos
    if(orderedReturns.some(r => r.length === 0)) {
        throw new Error("Erro inesperado: A lista de retornos de um ativo está vazia mesmo após validação inicial.");
    }

    const stats = orderedReturns.map(r => this.calculateStats(r));
    const expectedReturns = stats.map(s => s.mean);
    const covMatrix = this.calculateCovariance(orderedReturns);

    // 5. Monte Carlo Simulation
    const numPortfolios = 10000;
    let maxSharpe = -Infinity;
    let minVol = Infinity;
    
    let bestSharpeWeights: number[] = [];
    let bestSharpeStats = { ret: 0, vol: 0, sharpe: 0 };

    let minVolWeights: number[] = [];
    let minVolStats = { ret: 0, vol: 0, sharpe: 0 };

    let targetReturnWeights: number[] = [];
    let targetReturnStats = { ret: 0, vol: Infinity, sharpe: 0 };

    for (let i = 0; i < numPortfolios; i++) {
      let weights = assets.map(() => Math.random());
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);

      const portReturn = weights.reduce((acc, w, idx) => acc + w * expectedReturns[idx], 0);

      let variance = 0;
      for (let j = 0; j < assets.length; j++) {
        for (let k = 0; k < assets.length; k++) {
          variance += weights[j] * weights[k] * covMatrix[j][k];
        }
      }
      const portVol = Math.sqrt(variance);
      const sharpe = (portReturn - (riskFreeRate / 100)) / portVol;

      // Validação de Robustez dentro do Loop
      if (!isFinite(portReturn) || !isFinite(portVol) || !isFinite(sharpe)) {
          // Loga um aviso mas não para a simulação inteira, apenas descarta este resultado.
          console.warn(`Simulação ${i} resultou em valores inválidos (ret: ${portReturn}, vol: ${portVol}). Pesos: ${weights}. Pulando.`);
          continue;
      }

      if (sharpe > maxSharpe) {
        maxSharpe = sharpe;
        bestSharpeWeights = weights;
        bestSharpeStats = { ret: portReturn, vol: portVol, sharpe };
      }

      if (portVol < minVol) {
        minVol = portVol;
        minVolWeights = weights;
        minVolStats = { ret: portReturn, vol: portVol, sharpe };
      }

      if (portReturn >= targetReturn && portVol < targetReturnStats.vol) {
          targetReturnStats = { ret: portReturn, vol: portVol, sharpe };
          targetReturnWeights = weights;
      }
    }

    if (bestSharpeWeights.length === 0) {
        throw new Error("Não foi possível encontrar um portfólio ótimo de Sharpe Máximo após as simulações. Verifique os dados de entrada.");
    }

    // 6. Construct Scenarios
    const createScenario = (name: string, weights: number[], s: typeof bestSharpeStats): PortfolioScenario => {
      const wMap: { [key: string]: number } = {};
      assets.forEach((a, idx) => wMap[a.ticker] = weights[idx] || 0);
      return {
        name,
        weights: wMap,
        performance: {
          expectedReturn: s.ret,
          volatility: s.vol,
          sharpeRatio: s.sharpe
        }
      };
    };

    const scenarios = [
      createScenario('Max Sharpe Ratio', bestSharpeWeights, bestSharpeStats),
      createScenario('Min Volatility', minVolWeights, minVolStats),
    ];

    if (targetReturnWeights.length > 0) {
        scenarios.push(createScenario(`Target Return ${(targetReturn*100).toFixed(0)}%`, targetReturnWeights, targetReturnStats));
    }

    return scenarios;
  }
}

export const portfolioOptimizer = new PortfolioOptimizer();
