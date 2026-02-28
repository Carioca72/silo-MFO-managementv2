import { MonthlyQuote } from '../market/types.js';
import { bacenIntegration } from '../integration/bacenIntegration.js';
import { marketDataAggregator } from '../market/marketDataAggregator.js';
import { createPriceMatrix, fillMissingData } from '../../utils/dataUtils.js';

export interface BacktestResult {
  dates: string[];
  portfolioValues: number[];
  benchmarkValues: number[];
  metrics: {
    totalReturn: number;
    volatility: number;
    maxDrawdown: number;
    benchmarkReturn: number;
  };
}

export class BacktestEngine {
  
  /**
   * Runs a backtest simulation.
   * @param weights Optimized weights { ticker: weight }
   * @param tickers List of tickers
   * @param benchmark 'CDI' | 'IBOVESPA'
   * @param initialInvestment Initial capital (default 10000)
   */
  public async run(
    weights: { [ticker: string]: number },
    tickers: string[],
    benchmark: 'CDI' | 'IBOVESPA',
    initialInvestment: number = 10000
  ): Promise<BacktestResult> {
    
    // 1. Fetch Historical Data (24 months)
    // We need daily data for accurate drawdown, but our aggregator does monthly.
    // For "Performance Histórica Simulada" chart, monthly points are usually acceptable for a 2-year view,
    // but daily is better for Volatility/Drawdown.
    // Given the constraints and existing MonthlyQuote type, we will use Monthly data for the simulation.
    // NOTE: Real volatility calculation on monthly data needs adjustment (sqrt(12)).
    
    const monthlyQuotes = await marketDataAggregator.getMonthlyQuotes(tickers);
    
    // 2. Prepare Portfolio Data
    const priceMatrix = createPriceMatrix(monthlyQuotes);
    const filledPrices = fillMissingData(priceMatrix);
    const dates = priceMatrix.dates;

    // Filter for last 24 months (or whatever is available)
    // Assuming dates are sorted YYYY-MM-DD
    const cutoffIndex = Math.max(0, dates.length - 24);
    const testDates = dates.slice(cutoffIndex);
    
    // 3. Calculate Portfolio Value Series
    const portfolioValues: number[] = [initialInvestment];
    let currentCapital = initialInvestment;
    
    // We need returns for each period
    for (let i = 1; i < testDates.length; i++) {
        const date = testDates[i];
        const prevDate = testDates[i-1];
        
        let periodReturn = 0;
        
        for (const ticker of tickers) {
            const weight = weights[ticker] || 0;
            if (weight === 0) continue;
            
            const prices = filledPrices[ticker];
            // Find price at index corresponding to date
            // Since we sliced dates, we need to map back to original indices or slice prices too
            const idx = cutoffIndex + i;
            const prevIdx = cutoffIndex + i - 1;
            
            const price = prices[idx];
            const prevPrice = prices[prevIdx];
            
            if (prevPrice && prevPrice > 0) {
                const assetReturn = (price - prevPrice) / prevPrice;
                periodReturn += weight * assetReturn;
            }
        }
        
        currentCapital *= (1 + periodReturn);
        portfolioValues.push(currentCapital);
    }

    // 4. Calculate Benchmark Series
    let benchmarkValues: number[] = [initialInvestment];
    
    if (benchmark === 'CDI') {
        // Fetch Selic/CDI series
        // Since we are using monthly steps, we need monthly accumulated CDI.
        // Bacen getSelicSeries returns daily. We need to aggregate.
        const selicSeries = await bacenIntegration.getSelicSeries(24);
        
        // Map daily selic to the testDates intervals
        let benchmarkCapital = initialInvestment;
        
        for (let i = 1; i < testDates.length; i++) {
            const date = testDates[i];
            const prevDate = testDates[i-1];
            
            // Filter selic rates between prevDate (exclusive) and date (inclusive)
            const rates = selicSeries.filter(s => s.date > prevDate && s.date <= date);
            
            let periodFactor = 1;
            rates.forEach(r => {
                periodFactor *= (1 + r.value / 100);
            });
            
            benchmarkCapital *= periodFactor;
            benchmarkValues.push(benchmarkCapital);
        }
    } else {
        // IBOVESPA (^BVSP)
        const bovaQuotes = await marketDataAggregator.getMonthlyQuotes(['^BVSP']);
        // If ^BVSP fails, try BOVA11 as proxy
        const benchmarkTicker = bovaQuotes.length > 0 ? '^BVSP' : 'BOVA11.SA';
        const benchmarkData = bovaQuotes.length > 0 ? bovaQuotes : await marketDataAggregator.getMonthlyQuotes(['BOVA11.SA']);
        
        const bmMatrix = createPriceMatrix(benchmarkData);
        const bmFilled = fillMissingData(bmMatrix);
        const bmPrices = bmFilled[benchmarkTicker] || [];
        
        // Align benchmark dates with testDates
        // Simple approach: find closest date
        let benchmarkCapital = initialInvestment;
        
        for (let i = 1; i < testDates.length; i++) {
            // Find price for this date
            const date = testDates[i];
            const prevDate = testDates[i-1];
            
            // In our matrix, dates are exact.
            const idx = bmMatrix.dates.indexOf(date);
            const prevIdx = bmMatrix.dates.indexOf(prevDate);
            
            if (idx !== -1 && prevIdx !== -1) {
                const p = bmPrices[idx];
                const prevP = bmPrices[prevIdx];
                if (prevP > 0) {
                    benchmarkCapital *= (1 + (p - prevP) / prevP);
                }
            }
            benchmarkValues.push(benchmarkCapital);
        }
    }

    // 5. Calculate Metrics
    const totalReturn = (portfolioValues[portfolioValues.length - 1] - initialInvestment) / initialInvestment;
    const benchmarkReturn = (benchmarkValues[benchmarkValues.length - 1] - initialInvestment) / initialInvestment;
    
    // Volatility (Annualized)
    const returns = [];
    for(let i=1; i<portfolioValues.length; i++) {
        returns.push((portfolioValues[i] - portfolioValues[i-1]) / portfolioValues[i-1]);
    }
    const meanRet = returns.reduce((a,b) => a+b, 0) / returns.length;
    const variance = returns.reduce((a,b) => a + Math.pow(b - meanRet, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(12); // Annualized for monthly

    // Max Drawdown
    let maxDd = 0;
    let peak = -Infinity;
    for (const val of portfolioValues) {
        if (val > peak) peak = val;
        const dd = (peak - val) / peak;
        if (dd > maxDd) maxDd = dd;
    }

    return {
        dates: testDates,
        portfolioValues,
        benchmarkValues,
        metrics: {
            totalReturn,
            volatility,
            maxDrawdown: maxDd,
            benchmarkReturn
        }
    };
  }
}

export const backtestEngine = new BacktestEngine();
