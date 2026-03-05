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
    // BUG-014: Alterar cache para 12 horas (43200 segundos)
    this.cache = new CacheManager<MonthlyQuote[]>(43200); 
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
    
    let usdBrlSeries: { date: string; value: number }[] = [];
    
    tickers.forEach(t => {
        if (this.isInternational(t)) {
            internationalTickers.push(t);
        }
    });

    if (internationalTickers.length > 0) {
        usdBrlSeries = await bacenIntegration.getUSDBRLSeries(36);
    }

    for (const ticker of tickers) {
      if (this.isLongName(ticker)) {
          console.log(`Generating synthetic data for non-ticker asset: ${ticker}`);
          const synthetic = await this.generateSyntheticHistory(ticker, 36);
          allQuotes.push(...synthetic);
          continue;
      }

      const provider = this.getProviderForTicker(ticker);
      if (provider) {
        try {
          let quotes = await provider.fetchMonthlyQuotes(ticker, 36);
          
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
      return ticker.includes(' ') || ticker.length > 10;
  }

  private async generateSyntheticHistory(ticker: string, months: number): Promise<MonthlyQuote[]> {
      const isCredit = ticker.toUpperCase().includes('DEB') || 
                       ticker.toUpperCase().includes('CRI') || 
                       ticker.toUpperCase().includes('CRA');

      if (isCredit) {
          console.log(`Using DEBB11 proxy for ${ticker}`);
          const proxyTicker = 'DEBB11.SA';
          const provider = this.getProviderForTicker(proxyTicker);
          if (provider) {
              try {
                  const proxyQuotes = await provider.fetchMonthlyQuotes(proxyTicker, months);
                  if (proxyQuotes.length > 0) {
                      return proxyQuotes.map(q => ({ ...q, ticker }));
                  }
              } catch (e) {
                  console.warn('Failed to fetch DEBB11 proxy, falling back to CDI');
              }
          }
      }

      const selic = await bacenIntegration.getSelicSeries(months);
      const quotes: MonthlyQuote[] = [];
      let price = 100;
      
      const byMonth = new Map<string, number[]>();
      selic.forEach(d => {
          const monthKey = d.date.substring(0, 7); 
          if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
          byMonth.get(monthKey)!.push(d.value);
      });
      
      const sortedMonths = Array.from(byMonth.keys()).sort();
      
      for (const m of sortedMonths) {
          const rates = byMonth.get(m)!;
          let monthFactor = 1;
          rates.forEach(r => monthFactor *= (1 + r/100));
          
          price *= monthFactor;
          
          quotes.push({
              ticker,
              date: `${m}-28`,
              price
          });
      }
      
      return quotes;
  }

  private isInternational(ticker: string): boolean {
      if (ticker === '^BVSP') return false;
      if (ticker.endsWith('.SA')) return false; 
      if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) return false;
      
      return true;
  }

  private convertCurrency(quotes: MonthlyQuote[], fxSeries: { date: string; value: number }[]): MonthlyQuote[] {
      const sortedFx = [...fxSeries].sort((a, b) => a.date.localeCompare(b.date));
      const fxMap = new Map<string, number>();
      sortedFx.forEach(x => fxMap.set(x.date, x.value));
      const fxDates = sortedFx.map(x => x.date);

      return quotes.map(q => {
          let rate = 1;
          if (fxMap.has(q.date)) {
              rate = fxMap.get(q.date)!;
          } else {
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
    if (ticker.includes('.SA') || /^[A-Z]{4}\d{1,2}$/.test(ticker)) {
        return this.providers.find(p => p.constructor.name === 'BrapiProvider');
    }
    
    return this.providers.find(p => p.constructor.name === 'YahooFinanceProvider');
  }
}

export const marketDataAggregator = new MarketDataAggregator();
