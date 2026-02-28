import { format, subYears } from 'date-fns';

interface SeriesData {
  data: string;
  valor: string;
}

export class BacenIntegration {
  private static instance: BacenIntegration;
  private selicCache: number | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

  private constructor() {}

  public static getInstance(): BacenIntegration {
    if (!BacenIntegration.instance) {
      BacenIntegration.instance = new BacenIntegration();
    }
    return BacenIntegration.instance;
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }

  /**
   * Fetches the current SELIC rate (annualized) from BCB API
   */
  public async getRiskFreeRate(): Promise<number> {
    if (this.selicCache && (Date.now() - this.lastFetch < this.CACHE_TTL)) {
      return this.selicCache;
    }

    try {
      // Fetching Selic Meta (Series 432)
      const data: SeriesData[] = await this.fetchWithRetry('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
      
      if (data && data.length > 0) {
        const rate = parseFloat(data[0].valor);
        this.selicCache = rate;
        this.lastFetch = Date.now();
        return rate;
      }
      throw new Error('Empty data from BCB');
    } catch (error) {
      console.error('Error fetching Risk Free Rate:', error);
      return 10.5; // Fallback
    }
  }

  public async getIPCA(): Promise<number> {
    try {
      const endDate = format(new Date(), 'dd/MM/yyyy');
      const startDate = format(subYears(new Date(), 1), 'dd/MM/yyyy');
      
      const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;
      const data: SeriesData[] = await this.fetchWithRetry(url);
      
      // Calculate accumulated IPCA
      let acc = 1;
      data.forEach(item => {
        acc *= (1 + parseFloat(item.valor) / 100);
      });
      return (acc - 1) * 100;
    } catch (error) {
      console.error('Error fetching IPCA:', error);
      return 4.5; // Fallback
    }
  }
}

export const bacenIntegration = BacenIntegration.getInstance();
