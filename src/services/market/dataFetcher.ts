import yahooFinance from 'yahoo-finance2';
import { format, subYears } from 'date-fns';

export interface AssetHistory {
  date: string;
  close: number;
}

export interface AssetData {
  ticker: string;
  history: AssetHistory[];
  currentPrice: number;
}

export class DataFetcher {
  
  /**
   * Fetches historical data for a list of tickers.
   * Supports Yahoo Finance.
   */
  public async fetchMarketData(tickers: string[], years: number = 2): Promise<AssetData[]> {
    const startDate = subYears(new Date(), years);
    const results: AssetData[] = [];

    for (const ticker of tickers) {
      try {
        // Normalize ticker for Yahoo (add .SA for B3 if not present)
        const yTicker = ticker.endsWith('.SA') || ticker.includes('.') ? ticker : `${ticker}.SA`;
        
        const queryOptions = {
          period1: startDate,
          interval: '1d' as const
        };

        const result = await yahooFinance.historical(yTicker, queryOptions) as any[];
        const quote = await yahooFinance.quote(yTicker) as any;

        if (result && result.length > 0) {
          results.push({
            ticker: ticker, // Keep original ticker name
            currentPrice: quote.regularMarketPrice || result[result.length - 1].close,
            history: result.map((row: any) => ({
              date: row.date.toISOString().split('T')[0],
              close: row.close
            }))
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch data for ${ticker}:`, error);
        // Continue with other tickers
      }
    }

    return results;
  }
}

export const dataFetcher = new DataFetcher();
