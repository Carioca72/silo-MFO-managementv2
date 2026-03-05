import { MonthlyQuote } from '../services/market/types.js';

/**
 * BUG-017: Refatorado para usar Map para melhor performance e clareza.
 * Creates a price matrix from a list of quotes, aligning all assets to a common set of dates.
 */
export function createPriceMatrix(
  quotes: MonthlyQuote[],
  requestedTickers: string[]
): { 
  dates: string[], 
  prices: Map<string, (number | null)[]>, 
  missingHistoryTickers: string[] 
} {
  const dataByTicker = new Map<string, Map<string, number>>();
  const allDates = new Set<string>();

  // Agrupa os preços por ticker e data
  quotes.forEach(q => {
    if (!dataByTicker.has(q.ticker)) {
      dataByTicker.set(q.ticker, new Map<string, number>());
    }
    dataByTicker.get(q.ticker)!.set(q.date, q.price);
    allDates.add(q.date);
  });

  const sortedDates = Array.from(allDates).sort();
  const matrixData = new Map<string, (number | null)[]>();

  const tickersWithData = Array.from(dataByTicker.keys());
  const missingHistoryTickers = requestedTickers.filter(t => !tickersWithData.includes(t));

  // Monta a matriz de preços alinhada pelas datas
  for (const ticker of requestedTickers) {
    const tickerData = dataByTicker.get(ticker);
    if (tickerData) {
      const prices = sortedDates.map(date => tickerData.get(date) ?? null);
      matrixData.set(ticker, prices);
    } else {
      // Se o ticker não tem histórico, preenche com nulls
      matrixData.set(ticker, Array(sortedDates.length).fill(null));
    }
  }

  return { dates: sortedDates, prices: matrixData, missingHistoryTickers };
}


/**
 * Fills missing data (nulls) using forward-fill then back-fill.
 * Adaptação para trabalhar com o Map da nova `createPriceMatrix`.
 */
export function fillMissingData(matrix: { prices: Map<string, (number | null)[]> }): Map<string, number[]> {
  const filledPrices = new Map<string, number[]>();

  matrix.prices.forEach((priceArray, ticker) => {
    // Faz uma cópia para evitar mutação
    let prices = [...priceArray];

    // 1. Forward fill
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] === null) {
        prices[i] = prices[i - 1];
      }
    }

    // 2. Backward fill (para nulos no início)
    for (let i = prices.length - 2; i >= 0; i--) {
      if (prices[i] === null) {
        prices[i] = prices[i + 1];
      }
    }
    
    // Filtra possíveis nulos restantes (se a série inteira era nula)
    const finalPrices = prices.filter(p => p !== null) as number[];
    filledPrices.set(ticker, finalPrices);
  });

  return filledPrices;
}
