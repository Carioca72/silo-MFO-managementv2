import * as math from 'mathjs';

export interface Asset {
  id: string;
  ticker: string;
  expectedReturn: number; // Annualized %
  volatility: number;     // Annualized %
  weight?: number;        // Current weight (0-1)
}

export interface OptimizationConstraint {
  minWeight: number;
  maxWeight: number;
  targetReturn?: number;
}

export interface OptimizationResult {
  optimalWeights: { [ticker: string]: number };
  portfolioReturn: number;
  portfolioVolatility: number;
  sharpeRatio: number;
}

export class MarkowitzService {
  
  /**
   * Calculates the optimal portfolio weights to maximize Sharpe Ratio
   * This uses a simplified Monte Carlo simulation approach for robustness 
   * since quadratic programming solvers are complex to implement in pure TS without heavy libs.
   * For production, consider using a dedicated WASM solver or Python bridge.
   */
  optimize(assets: Asset[], riskFreeRate: number, constraints: OptimizationConstraint): OptimizationResult {
    const numPortfolios = 5000; // Number of simulations
    let bestSharpe = -Infinity;
    let bestWeights: number[] = [];
    let bestReturn = 0;
    let bestVol = 0;

    // Covariance matrix (Simplified: assuming correlation = 0.5 for all pairs if no history provided)
    // In a real system, we would calculate this from historical price series.
    const n = assets.length;
    const correlation = 0.5; 
    
    for (let i = 0; i < numPortfolios; i++) {
        // Generate random weights
        let weights = assets.map(() => Math.random());
        const sumWeights = weights.reduce((a, b) => a + b, 0);
        weights = weights.map(w => w / sumWeights); // Normalize to 1

        // Apply constraints (simple rejection sampling)
        const valid = weights.every(w => w >= constraints.minWeight && w <= constraints.maxWeight);
        if (!valid) continue;

        // Calculate Portfolio Return
        const portReturn = weights.reduce((acc, w, idx) => acc + w * (assets[idx].expectedReturn / 100), 0);

        // Calculate Portfolio Volatility
        // Vol_p^2 = w' * Cov * w
        let variance = 0;
        for (let j = 0; j < n; j++) {
            for (let k = 0; k < n; k++) {
                const w1 = weights[j];
                const w2 = weights[k];
                const vol1 = assets[j].volatility / 100;
                const vol2 = assets[k].volatility / 100;
                
                let cov = 0;
                if (j === k) {
                    cov = vol1 * vol1;
                } else {
                    cov = vol1 * vol2 * correlation;
                }
                variance += w1 * w2 * cov;
            }
        }
        const portVol = Math.sqrt(variance);

        // Sharpe Ratio
        const sharpe = (portReturn - (riskFreeRate / 100)) / portVol;

        if (sharpe > bestSharpe) {
            bestSharpe = sharpe;
            bestWeights = weights;
            bestReturn = portReturn;
            bestVol = portVol;
        }
    }

    const optimalWeightsMap: { [ticker: string]: number } = {};
    assets.forEach((asset, idx) => {
        optimalWeightsMap[asset.ticker] = bestWeights[idx] || 0;
    });

    return {
        optimalWeights: optimalWeightsMap,
        portfolioReturn: bestReturn * 100,
        portfolioVolatility: bestVol * 100,
        sharpeRatio: bestSharpe
    };
  }
}

export const markowitzService = new MarkowitzService();
