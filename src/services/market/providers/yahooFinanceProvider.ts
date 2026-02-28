import yahooFinance from 'yahoo-finance2';
import { IMarketDataProvider, MonthlyQuote } from '../types.js';
import { subMonths, format } from 'date-fns';

export class YahooFinanceProvider implements IMarketDataProvider {
  public async fetchMonthlyQuotes(ticker: string, months: number): Promise<MonthlyQuote[]> {
    const endDate = new Date();
    const startDate = subMonths(endDate, months);

    // Yahoo Finance expects '1mo' for monthly interval
    const queryOptions = {
      period1: startDate,
      period2: endDate,
      interval: '1mo' as const,
    };

    try {
      const results = await yahooFinance.historical(ticker, queryOptions);

      return (results as any[]).map(item => ({
        ticker,
        date: item.date.toISOString().split('T')[0],
        price: item.close,
      }));
    } catch (error) {
      console.error(`YahooFinanceProvider Error for ${ticker}:`, error);
      return [];
    }
  }
}
