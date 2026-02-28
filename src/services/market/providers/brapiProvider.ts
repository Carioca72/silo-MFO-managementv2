import { IMarketDataProvider, MonthlyQuote } from '../types.js';
import { subMonths } from 'date-fns';

export class BrapiProvider implements IMarketDataProvider {
  private token: string;

  constructor() {
    // Using the token from the prompt context or env
    this.token = process.env.BRAPI_TOKEN || 'q9Q5zRLxqKqeKUHVoPd31n'; 
  }

  public async fetchMonthlyQuotes(ticker: string, months: number): Promise<MonthlyQuote[]> {
    try {
      // Brapi doesn't have a direct "monthly" interval in the free tier usually, or it behaves like daily.
      // We will fetch daily/range and resample manually if needed, or use '1mo' if supported.
      // The prompt suggests fetching range='2y' and resampling.
      
      const range = '5y'; // Fetch enough data
      const interval = '1mo'; // Try monthly interval if available, else 1d
      
      const url = `https://brapi.dev/api/quote/${ticker}?range=${range}&interval=${interval}&token=${this.token}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Brapi API Error: ${response.statusText}`);
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }

      const historical = data.results[0].historicalDataPrice;
      if (!historical) return [];

      // Filter for the requested months
      const cutoffDate = subMonths(new Date(), months);
      
      return historical
        .filter((item: any) => new Date(item.date * 1000) >= cutoffDate)
        .map((item: any) => ({
          ticker,
          date: new Date(item.date * 1000).toISOString().split('T')[0],
          price: item.close
        }));

    } catch (error) {
      console.error(`BrapiProvider Error for ${ticker}:`, error);
      return [];
    }
  }
}
