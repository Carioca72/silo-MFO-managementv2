import * as math from 'mathjs';
import { AssetData } from '../market/dataFetcher.js';
import { marketDataAggregator } from '../market/marketDataAggregator.js';
import { bacenIntegration } from '../../services/integration/bacenIntegration.js';
import { createPriceMatrix, fillMissingData } from '../../utils/dataUtils.js';

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
      returns.push((history[i] - history[i - 1]) / history[i - 1]);
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
    const minLen = Math.min(...assetsReturns.map(r => r.length));
    
    const alignedReturns = assetsReturns.map(r => r.slice(r.length - minLen));
    
    const covMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const meanI = math.mean(alignedReturns[i]) as unknown as number;
        const meanJ = math.mean(alignedReturns[j]) as unknown as number;
        let sum = 0;
        for (let k = 0; k < minLen; k++) {
          sum += (alignedReturns[i][k] - meanI) * (alignedReturns[j][k] - meanJ);
        }
        covMatrix[i][j] = (sum / (minLen - 1)) * 12; // Annualized (Monthly)
      }
    }
    return covMatrix;
  }

  public async optimize(assets: AssetData[], riskFreeRate: number, targetReturn: number = 0.15): Promise<PortfolioScenario[]> {
    // 1. Validate Target Return against Dynamic Benchmark
    const marketBenchmark = await bacenIntegration.getMarketBenchmark();
    const benchmarkVal = marketBenchmark / 100; // Convert to decimal

    if (targetReturn < benchmarkVal) {
        console.warn(`Target Return (${targetReturn}) is below Market Benchmark (${benchmarkVal}). Adjusting logic if needed.`);
    }

    // 2. Fetch Monthly Data via Aggregator (replacing daily data from DataFetcher for optimization)
    const tickers = assets.map(a => a.ticker);
    const monthlyQuotes = await marketDataAggregator.getMonthlyQuotes(tickers);
    
    // 3. Align and Fill Data
    const priceMatrix = createPriceMatrix(monthlyQuotes);
    const filledPrices = fillMissingData(priceMatrix);

    // 4. Calculate Returns
    const returnsList: number[][] = [];
    const assetTickers = Object.keys(filledPrices);
    
    // Ensure order matches 'assets' array for weight mapping
    // We need to map back to the original assets array order
    const orderedReturns: number[][] = [];
    
    assets.forEach(asset => {
        const prices = filledPrices[asset.ticker];
        if (prices && prices.length > 1) {
            orderedReturns.push(this.calculateReturns(prices));
        } else {
            // Fallback if no data found
            orderedReturns.push([]);
        }
    });

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

    // Target Return Logic
    const targetReturnVal = targetReturn; 
    let targetReturnWeights: number[] = [];
    let targetReturnStats = { ret: 0, vol: Infinity, sharpe: 0 };

    for (let i = 0; i < numPortfolios; i++) {
      // Generate random weights
      let weights = assets.map(() => Math.random());
      const sum = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / sum);

      // Portfolio Return
      const portReturn = weights.reduce((acc, w, idx) => acc + w * expectedReturns[idx], 0);

      // Portfolio Volatility
      let variance = 0;
      for (let j = 0; j < assets.length; j++) {
        for (let k = 0; k < assets.length; k++) {
          variance += weights[j] * weights[k] * covMatrix[j][k];
        }
      }
      const portVol = Math.sqrt(variance);

      // Sharpe
      const sharpe = (portReturn - (riskFreeRate / 100)) / portVol;

      // Check Max Sharpe
      if (sharpe > maxSharpe) {
        maxSharpe = sharpe;
        bestSharpeWeights = weights;
        bestSharpeStats = { ret: portReturn, vol: portVol, sharpe };
      }

      // Check Min Vol
      if (portVol < minVol) {
        minVol = portVol;
        minVolWeights = weights;
        minVolStats = { ret: portReturn, vol: portVol, sharpe };
      }

      // Check Target Return (Closest to target with min vol)
      if (portReturn >= targetReturnVal && portVol < targetReturnStats.vol) {
          targetReturnStats = { ret: portReturn, vol: portVol, sharpe };
          targetReturnWeights = weights;
      }
    }

    // 6. Construct Scenarios
    const createScenario = (name: string, weights: number[], s: typeof bestSharpeStats): PortfolioScenario => {
      const wMap: { [key: string]: number } = {};
      assets.forEach((a, idx) => wMap[a.ticker] = weights[idx]);
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
        scenarios.push(createScenario(`Target Return ${(targetReturnVal*100).toFixed(0)}%`, targetReturnWeights, targetReturnStats));
    }

    return scenarios;
  }
  
  public async getEfficientFrontierPoints(assets: AssetData[], riskFreeRate: number): Promise<{ x: number, y: number, sharpe: number }[]> {
      // Re-implement using monthly data logic or reuse common logic
      // For brevity, I'll duplicate the prep logic here or refactor later.
      // Let's just use the same prep logic.
      
      const tickers = assets.map(a => a.ticker);
      const monthlyQuotes = await marketDataAggregator.getMonthlyQuotes(tickers);
      const priceMatrix = createPriceMatrix(monthlyQuotes);
      const filledPrices = fillMissingData(priceMatrix);
      
      const orderedReturns: number[][] = [];
      assets.forEach(asset => {
        const prices = filledPrices[asset.ticker];
        if (prices) orderedReturns.push(this.calculateReturns(prices));
        else orderedReturns.push([]);
      });

      const stats = orderedReturns.map(r => this.calculateStats(r));
      const expectedReturns = stats.map(s => s.mean);
      const covMatrix = this.calculateCovariance(orderedReturns);
      
      const points: { x: number, y: number, sharpe: number }[] = [];
      const numPortfolios = 2000; 
      
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
          
          points.push({ x: portVol * 100, y: portReturn * 100, sharpe });
      }
      return points;
  }
}

export const portfolioOptimizer = new PortfolioOptimizer();
