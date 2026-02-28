import puppeteer from 'puppeteer';

export interface MarketData {
  ticker: string;
  price: number;
  ret_12m: number;
  volatility_12m: number;
  dy: number;
  pvp: number;
  pl: number;
  last_updated: string;
}

export class MarketDataService {
  private browser: any;

  private async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async getTickerData(ticker: string): Promise<MarketData> {
    await this.initBrowser();
    const page = await this.browser.newPage();
    
    // Normalize ticker
    const cleanTicker = ticker.toUpperCase().trim();
    const isFII = cleanTicker.endsWith('11');
    
    // Determine Source (StatusInvest is reliable for BR market)
    const url = isFII 
      ? `https://statusinvest.com.br/fundos-imobiliarios/${cleanTicker.toLowerCase()}`
      : `https://statusinvest.com.br/acoes/${cleanTicker.toLowerCase()}`;

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract Data using specific selectors for StatusInvest
      const data = await page.evaluate(() => {
        const parseValue = (text: string) => {
          if (!text || text === '-') return 0;
          return parseFloat(text.replace('.', '').replace(',', '.').replace('%', ''));
        };

        // Selectors might change, this is a best-effort implementation based on current structure
        const price = document.querySelector('.value')?.textContent || '0';
        const dy = document.querySelector('div[title="Dividend Yield com base nos últimos 12 meses"] .value')?.textContent || '0';
        const pvp = document.querySelector('div[title="P/VP"] .value')?.textContent || '0';
        const pl = document.querySelector('div[title="P/L"] .value')?.textContent || '0';
        
        // Volatility and 12m return often need more complex extraction or calculation from history
        // For this implementation, we'll try to find the 12m appreciation
        const ret12m = document.querySelector('div[title="Valorização nos últimos 12 meses"] .value')?.textContent || '0';

        return {
          price: parseValue(price),
          dy: parseValue(dy),
          pvp: parseValue(pvp),
          pl: parseValue(pl),
          ret_12m: parseValue(ret12m)
        };
      });

      return {
        ticker: cleanTicker,
        price: data.price,
        ret_12m: data.ret_12m,
        volatility_12m: 0, // Volatility requires historical series calculation, defaulting to 0 for single point fetch
        dy: data.dy,
        pvp: data.pvp,
        pl: data.pl,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error fetching data for ${cleanTicker}:`, error);
      throw new Error(`Failed to fetch data for ${cleanTicker}`);
    } finally {
      await page.close();
    }
  }

  async getBatchData(tickers: string[]): Promise<MarketData[]> {
    const results: MarketData[] = [];
    // Process in chunks to avoid overloading
    for (const ticker of tickers) {
      try {
        const data = await this.getTickerData(ticker);
        results.push(data);
      } catch (e) {
        console.warn(`Skipping ${ticker} due to error`);
        results.push({
            ticker, price: 0, ret_12m: 0, volatility_12m: 0, dy: 0, pvp: 0, pl: 0,
            last_updated: new Date().toISOString()
        });
      }
    }
    return results;
  }
}

export const marketDataService = new MarketDataService();
