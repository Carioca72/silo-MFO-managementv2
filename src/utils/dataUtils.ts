import { MonthlyQuote } from '../services/market/types.js';

/**
 * Creates a price matrix (object of arrays) from a list of quotes.
 * Aligns all assets to the same set of sorted dates.
 */
export function createPriceMatrix(quotes: MonthlyQuote[]): { dates: string[], prices: { [ticker: string]: (number | null)[] } } {
  const dataByTicker: { [key: string]: { [date: string]: number } } = {};
  const allDates = new Set<string>();

  quotes.forEach(q => {
    if (!dataByTicker[q.ticker]) dataByTicker[q.ticker] = {};
    dataByTicker[q.ticker][q.date] = q.price;
    allDates.add(q.date);
  });

  const sortedDates = Array.from(allDates).sort();
  const matrixData: { [key: string]: (number | null)[] } = {};

  for (const ticker in dataByTicker) {
    matrixData[ticker] = sortedDates.map(date => 
      dataByTicker[ticker][date] !== undefined ? dataByTicker[ticker][date] : null
    );
  }

  return { dates: sortedDates, prices: matrixData };
}

/**
 * Fills missing data (nulls) using forward fill logic.
 */
export function fillMissingData(matrix: { dates: string[], prices: { [ticker: string]: (number | null)[] } }): { [ticker: string]: number[] } {
  const filledPrices: { [ticker: string]: number[] } = {};

  for (const ticker in matrix.prices) {
    const prices = matrix.prices[ticker];
    const filled: number[] = [];
    let lastValid: number | null = null;

    // First pass: find first valid value to backfill if needed (or just start from first valid)
    // Standard ffill: propagate last valid value forward.
    
    for (const p of prices) {
      if (p !== null) {
        lastValid = p;
        filled.push(p);
      } else {
        // If we have a last valid, use it. If not (beginning of series), 
        // we might leave it as 0 or try backfill. 
        // For simplicity in portfolio opt, we usually drop initial rows if they are empty.
        // But here we will assume 0 or handle it later.
        filled.push(lastValid || 0); 
      }
    }
    
    // Handle leading zeros if any (backfill with first valid)
    const firstValidIndex = filled.findIndex(v => v !== 0);
    if (firstValidIndex > 0) {
        const firstVal = filled[firstValidIndex];
        for(let i=0; i<firstValidIndex; i++) filled[i] = firstVal;
    }

    filledPrices[ticker] = filled;
  }

  return filledPrices;
}
