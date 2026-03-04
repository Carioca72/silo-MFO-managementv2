import { MonthlyQuote } from '../services/market/types.js';

/**
 * Creates a price matrix (object of arrays) from a list of quotes.
 * Aligns all assets to the same set of sorted dates.
 * Ensures all requested tickers are present in the output matrix.
 * (FIX B-12)
 */
export function createPriceMatrix(
  quotes: MonthlyQuote[],
  requestedTickers: string[]
): { 
  dates: string[], 
  prices: { [ticker: string]: (number | null)[] }, 
  missingHistoryTickers: string[] 
} {
  const dataByTicker: { [key: string]: { [date: string]: number } } = {};
  const allDates = new Set<string>();

  quotes.forEach(q => {
    if (!dataByTicker[q.ticker]) dataByTicker[q.ticker] = {};
    dataByTicker[q.ticker][q.date] = q.price;
    allDates.add(q.date);
  });

  const sortedDates = Array.from(allDates).sort();
  const matrixData: { [key: string]: (number | null)[] } = {};
  
  const tickersWithData = Object.keys(dataByTicker);
  const missingHistoryTickers = requestedTickers.filter(t => !tickersWithData.includes(t));

  for (const ticker of requestedTickers) {
      if (dataByTicker[ticker]) {
          matrixData[ticker] = sortedDates.map(date => 
            dataByTicker[ticker][date] !== undefined ? dataByTicker[ticker][date] : null
          );
      } else {
          // For tickers with no history, create an array of nulls
          matrixData[ticker] = sortedDates.map(() => null);
      }
  }

  return { dates: sortedDates, prices: matrixData, missingHistoryTickers };
}


/**
 * Fills missing data (nulls) using forward-fill then back-fill.
 * (FIX B-12)
 */
export function fillMissingData(matrix: { prices: { [ticker: string]: (number | null)[] } }): { [ticker: string]: number[] } {
  const filledPrices: { [ticker: string]: number[] } = {};

  for (const ticker in matrix.prices) {
    // Make a copy to avoid mutating the original data
    let prices = [...matrix.prices[ticker]];

    // 1. Forward fill
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] === null) {
        prices[i] = prices[i - 1];
      }
    }

    // 2. Backward fill (for leading nulls)
    for (let i = prices.length - 2; i >= 0; i--) {
      if (prices[i] === null) {
        prices[i] = prices[i + 1];
      }
    }
    
    // If there are still nulls, it means the entire series was null. In that case, filter will create an empty array.
    const finalPrices = prices.filter(p => p !== null) as number[];
    filledPrices[ticker] = finalPrices;
  }

  return filledPrices;
}
