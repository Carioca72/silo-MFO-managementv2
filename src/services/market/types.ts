export interface MonthlyQuote {
  ticker: string;
  date: string; // YYYY-MM-DD
  price: number;
}

export interface IMarketDataProvider {
  fetchMonthlyQuotes(ticker: string, months: number): Promise<MonthlyQuote[]>;
}
