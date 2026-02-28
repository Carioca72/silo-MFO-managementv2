import { BrapiProvider } from './providers/brapiProvider.js';
import { YahooFinanceProvider } from './providers/yahooFinanceProvider.js';
import { CacheManager } from './cacheManager.js';
import { IMarketDataProvider, MonthlyQuote } from './types.js';
import { bacenIntegration } from '../integration/bacenIntegration.js';
import { createPriceMatrix, fillMissingData } from '../../utils/dataUtils.js';

export class MarketDataAggregator {
  private providers: IMarketDataProvider[];
  private cache: CacheManager<MonthlyQuote[]>;

  constructor() {
    this.providers = [
      new BrapiProvider(),
      new YahooFinanceProvider(),
    ];
    this.cache = new CacheManager<MonthlyQuote[]>(3600); // Cache de 1 hora
  }

  /**
   * Busca os últimos 36 meses de cotações mensais para uma lista de ativos.
   * Determina o provedor correto para cada ativo e consolida os resultados.
   * Converte ativos internacionais para BRL usando PTAX.
   */
  public async getMonthlyQuotes(tickers: string[]): Promise<MonthlyQuote[]> {
    const cacheKey = `monthly-quotes-fx-${tickers.sort().join(',')}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      console.log('Retornando dados do cache para:', tickers);
      return cachedData;
    }

    const allQuotes: MonthlyQuote[] = [];
    const internationalTickers: string[] = [];
    
    // Fetch PTAX series once if needed
    let usdBrlSeries: { date: string; value: number }[] = [];
    
    // Identify international tickers
    tickers.forEach(t => {
        if (this.isInternational(t)) {
            internationalTickers.push(t);
        }
    });

    if (internationalTickers.length > 0) {
        usdBrlSeries = await bacenIntegration.getUSDBRLSeries(36);
    }

    for (const ticker of tickers) {
      // Check if it's a valid ticker or a long name/description
      if (this.isLongName(ticker)) {
          // It's likely a Fixed Income or Private Credit asset.
          // We cannot fetch historical prices from Yahoo/Brapi.
          // We should return a proxy or skip.
          // For the optimizer to work, we need *some* history if it's included in optimization.
          // Ideally, we would generate a synthetic history based on CDI.
          // For now, let's log and skip, OR generate synthetic CDI-based data.
          // Let's generate synthetic data to prevent the optimizer from crashing or ignoring it.
          console.log(`Generating synthetic data for non-ticker asset: ${ticker}`);
          const synthetic = await this.generateSyntheticHistory(ticker, 36);
          allQuotes.push(...synthetic);
          continue;
      }

      const provider = this.getProviderForTicker(ticker);
      if (provider) {
        try {
          let quotes = await provider.fetchMonthlyQuotes(ticker, 36);
          
          // Apply FX Conversion if international
          if (this.isInternational(ticker) && usdBrlSeries.length > 0) {
              quotes = this.convertCurrency(quotes, usdBrlSeries);
          }
          
          allQuotes.push(...quotes);
        } catch (error) {
          console.error(`Falha ao buscar dados para ${ticker}:`, error);
        }
      }
    }

    this.cache.set(cacheKey, allQuotes);
    return allQuotes;
  }

  private isLongName(ticker: string): boolean {
      // If it has spaces or is longer than typical ticker (e.g. 6-7 chars), assume long name.
      // Tickers: PETR4 (5), PETR4.SA (8), KNIP11 (6).
      // "DEB MOVIDA" -> 10 chars, space.
      return ticker.includes(' ') || ticker.length > 10;
  }

  private async generateSyntheticHistory(ticker: string, months: number): Promise<MonthlyQuote[]> {
      // Use DEBB11 as proxy for Private Credit (Debentures, CRI, CRA)
      // If it's just general Fixed Income, use CDI.
      
      const isCredit = ticker.toUpperCase().includes('DEB') || 
                       ticker.toUpperCase().includes('CRI') || 
                       ticker.toUpperCase().includes('CRA');

      if (isCredit) {
          console.log(`Using DEBB11 proxy for ${ticker}`);
          // Try to fetch DEBB11 from providers
          const proxyTicker = 'DEBB11.SA';
          const provider = this.getProviderForTicker(proxyTicker);
          if (provider) {
              try {
                  const proxyQuotes = await provider.fetchMonthlyQuotes(proxyTicker, months);
                  if (proxyQuotes.length > 0) {
                      // Map proxy quotes to this ticker
                      // We need to normalize price to start at 100 or keep relative moves?
                      // Ideally keep relative moves.
                      // Let's just return the proxy quotes but with the requested ticker name.
                      // And maybe rebase price? No, optimizer uses returns, so absolute price level doesn't matter much 
                      // unless we display it. But for backtest, we need returns.
                      return proxyQuotes.map(q => ({ ...q, ticker }));
                  }
              } catch (e) {
                  console.warn('Failed to fetch DEBB11 proxy, falling back to CDI');
              }
          }
      }

      // Fallback to CDI (Synthetic)
      // Fetch CDI/Selic
      const selic = await bacenIntegration.getSelicSeries(months);
      // Aggregate to monthly
      // This is a simplified synthetic generator. 
      // Assume 100 base price and grow by Selic.
      
      const quotes: MonthlyQuote[] = [];
      let price = 100;
      
      // We need dates. Let's use the dates from Selic series, grouped by month.
      // Or just take the last day of each month.
      
      // Group selic by month
      const byMonth = new Map<string, number[]>();
      selic.forEach(d => {
          const monthKey = d.date.substring(0, 7); // YYYY-MM
          if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
          byMonth.get(monthKey)!.push(d.value);
      });
      
      // Sort months
      const sortedMonths = Array.from(byMonth.keys()).sort();
      
      for (const m of sortedMonths) {
          const rates = byMonth.get(m)!;
          let monthFactor = 1;
          rates.forEach(r => monthFactor *= (1 + r/100));
          
          price *= monthFactor;
          
          // Use the last date of the month from the series?
          // Or just construct YYYY-MM-28
          quotes.push({
              ticker,
              date: `${m}-28`, // Approx
              price
          });
      }
      
      return quotes;
  }

  private isInternational(ticker: string): boolean {
      // Heuristic: 
      // Ends with .SA -> BRL (even if BDR, it's traded in BRL)
      // No suffix and 4 letters + number -> BRL (e.g. PETR4)
      // Everything else -> International (USD)
      // Exception: ^BVSP is BRL
      if (ticker === '^BVSP') return false;
      if (ticker.endsWith('.SA')) return false; // BDRs are already in BRL
      if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) return false;
      
      return true; // AAPL, TSLA, IVV, etc.
  }

  private convertCurrency(quotes: MonthlyQuote[], fxSeries: { date: string; value: number }[]): MonthlyQuote[] {
      // Create a map for fast FX lookup
      // We need to match dates. Since quotes are monthly (often end of month), 
      // and FX series is daily, we find the closest FX rate.
      
      // Sort FX series by date
      const sortedFx = [...fxSeries].sort((a, b) => a.date.localeCompare(b.date));
      const fxMap = new Map<string, number>();
      sortedFx.forEach(x => fxMap.set(x.date, x.value));
      const fxDates = sortedFx.map(x => x.date);

      return quotes.map(q => {
          // Find exact match or closest previous date
          let rate = 1;
          if (fxMap.has(q.date)) {
              rate = fxMap.get(q.date)!;
          } else {
              // Find closest date <= q.date
              // Simple linear search backwards from end since dates are sorted
              // Or just find the last date in fxDates <= q.date
              let found = false;
              for (let i = fxDates.length - 1; i >= 0; i--) {
                  if (fxDates[i] <= q.date) {
                      rate = fxMap.get(fxDates[i])!;
                      found = true;
                      break;
                  }
              }
              if (!found && fxDates.length > 0) rate = fxMap.get(fxDates[0])!;
          }
          
          return {
              ...q,
              price: q.price * rate
          };
      });
  }

  private getProviderForTicker(ticker: string): IMarketDataProvider | undefined {
    // Ativos terminados em .SA são do Yahoo (se preferir) ou Brapi.
    // O prompt diz: "Ativos terminados em .SA são do Yahoo, outros da Brapi"
    // Mas geralmente Brapi é melhor para B3.
    // Vamos seguir a lógica do prompt, mas ajustada:
    // Se tiver .SA, é B3. Brapi é ótima para B3. Yahoo também.
    // O prompt diz: "Brapi (para ativos brasileiros) e Yahoo Finance (para ativos internacionais)"
    // Ativos brasileiros na Brapi geralmente NÃO precisam de sufixo .SA na busca, mas retornam com ele ou sem.
    // Ativos internacionais (AAPL, US) vão pro Yahoo.
    
    // Heuristic:
    // If ticker ends with .SA -> Brapi (remove .SA for brapi query if needed, but brapi handles it)
    // If ticker is just letters (PETR4) -> Brapi
    // If ticker is US (AAPL) -> Yahoo
    
    // Simplification based on prompt code:
    if (ticker.includes('.SA') || /^[A-Z]{4}\d{1,2}$/.test(ticker)) {
        // Looks like B3
        return this.providers.find(p => p.constructor.name === 'BrapiProvider');
    }
    
    // Default to Yahoo for international
    return this.providers.find(p => p.constructor.name === 'YahooFinanceProvider');
  }
}

export const marketDataAggregator = new MarketDataAggregator();
