import express from 'express';
import { bacenIntegration } from '../services/integration/bacenIntegration.js';
import { dataFetcher } from '../services/market/dataFetcher.js';
import { portfolioOptimizer } from '../services/math/portfolioOptimizer.js';
import { backtestEngine } from '../services/analysis/backtestEngine.js';
import { studyRepository } from '../services/persistence/studyRepository.js';

const router = express.Router();

// POST /api/portfolio/analyze
router.post('/analyze', async (req, res) => {
  const { tickers, targetReturn, benchmark = 'CDI' } = req.body;

  if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
    return res.status(400).json({ error: 'Tickers array is required' });
  }

  try {
    // 1. Get Risk Free Rate (FIX B-10)
    const selicRate = await bacenIntegration.getSelicRate();
    if (selicRate === null) {
        return res.status(500).json({ error: 'Could not retrieve the SELIC rate from BACEN.' });
    }
    const riskFreeRate = selicRate; // Use SELIC as the risk-free rate.

    // 2. Fetch Market Data (Used for basic stats, but optimizer now fetches its own monthly data)
    const assetData = await dataFetcher.fetchMarketData(tickers);
    
    if (assetData.length === 0) {
      return res.status(404).json({ error: 'No market data found for provided tickers' });
    }

    // 3. Optimize
    const scenarios = await portfolioOptimizer.optimize(assetData, riskFreeRate, targetReturn);
    const frontier = await portfolioOptimizer.getEfficientFrontierPoints(assetData, riskFreeRate);

    // 4. Backtest (using the Max Sharpe portfolio as the "Selected" one for demo)
    const bestScenario = scenarios.find(s => s.name === 'Max Sharpe Ratio');
    if (!bestScenario) {
        return res.status(500).json({ error: 'Max Sharpe Ratio scenario not found after optimization.' });
    }

    const backtestResult = await backtestEngine.run(
        bestScenario.weights,
        tickers,
        benchmark
    );

    // 5. Save Study
    await studyRepository.save({
        tickers,
        weights: bestScenario.weights,
        benchmark,
        metrics: bestScenario.performance,
        backtest: {
            totalReturn: backtestResult.metrics.totalReturn,
            maxDrawdown: backtestResult.metrics.maxDrawdown
        },
        createdAt: new Date()
    });

    res.json({
      risk_free_rate: riskFreeRate, // (FIX B-10)
      scenarios,
      frontier,
      backtest: backtestResult
    });

  } catch (error: any) {
    console.error('Portfolio Analysis Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
