import { CacheManager } from '../market/cacheManager.js';
import { format, subYears } from 'date-fns';

// Código da série para o IPCA no SGS do BCB
const IPCA_SERIES_CODE = 433;

export class BacenIntegration {
  private static instance: BacenIntegration;
  private cache: CacheManager<number>;
  private selicCache: number | null = null;

  private constructor() {
    // Cache de 24 horas para o IPCA
    this.cache = new CacheManager<number>(86400);
  }

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
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }

  public async getRiskFreeRate(): Promise<number> {
    if (this.selicCache) return this.selicCache;
    try {
      const data = await this.fetchWithRetry('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
      if (data && data.length > 0) {
        this.selicCache = parseFloat(data[0].valor);
        return this.selicCache;
      }
      return 10.5;
    } catch (e) {
      return 10.5;
    }
  }

  /**
   * Busca o valor acumulado do IPCA nos últimos 12 meses.
   */
  public async getAccumulatedIPCA(): Promise<number> {
    const cacheKey = 'accumulated-ipca-12m';
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    // Fetch last 13 months to calculate 12m variation
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${IPCA_SERIES_CODE}/dados/ultimos/13?formato=json`;
    
    try {
      const data: { data: string; valor: string }[] = await this.fetchWithRetry(url);
      
      // Calcular o acumulado
      // IPCA mensal é percentual. Acumulado = Prod(1 + taxa) - 1
      let acc = 1;
      // Skip the first one if we fetched 13 to get 12 variations? 
      // Series 433 is monthly % variation.
      // If we want 12 months accumulated, we just take the last 12 values.
      const last12 = data.slice(-12);
      
      last12.forEach(item => {
        acc *= (1 + parseFloat(item.valor) / 100);
      });
      
      const accumulated = (acc - 1) * 100;

      this.cache.set(cacheKey, accumulated);
      return accumulated;
    } catch (error) {
      console.error('Falha ao buscar dados do IPCA:', error);
      return 4.5; // Fallback
    }
  }

  /**
   * Fetches the daily SELIC series for the last N months.
   * Series 11: Selic daily rate (%)
   */
  public async getSelicSeries(months: number): Promise<{ date: string; value: number }[]> {
    const cacheKey = `selic-series-${months}`;
    // The cache is typed as CacheManager<number>, which is wrong for this method.
    // We should probably make CacheManager generic or use 'any' for now to fix the error quickly.
    // Or better, instantiate a separate cache for objects if we want strictness, but let's cast to unknown first.
    const cachedData = this.cache.get(cacheKey) as unknown as { date: string; value: number }[] | undefined;
    if (cachedData) return cachedData;

    // Approx 21 business days per month
    const lastN = months * 22; 
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/${lastN}?formato=json`;

    try {
      const data: { data: string; valor: string }[] = await this.fetchWithRetry(url);
      
      const formatted = data.map(item => ({
        date: item.data, // DD/MM/YYYY
        value: parseFloat(item.valor) // Daily %
      }));

      // Convert date to YYYY-MM-DD for consistency
      const standardized = formatted.map(item => {
        const [day, month, year] = item.date.split('/');
        return {
          date: `${year}-${month}-${day}`,
          value: item.value
        };
      });

      // CacheManager<number> set method expects number. We need to bypass or fix CacheManager.
      // Let's just cast to any to bypass the type check for this specific call, 
      // acknowledging technical debt to be fixed by making CacheManager generic properly in a refactor.
      (this.cache as any).set(cacheKey, standardized);
      return standardized;
    } catch (error) {
      console.error('Failed to fetch SELIC series:', error);
      return [];
    }
  }

  /**
   * Fetches the daily PTAX (USD/BRL) series for the last N months.
   * Series 1: Dólar (venda) - PTAX
   */
  public async getUSDBRLSeries(months: number): Promise<{ date: string; value: number }[]> {
    const cacheKey = `usdbrl-series-${months}`;
    const cachedData = this.cache.get(cacheKey) as unknown as { date: string; value: number }[] | undefined;
    if (cachedData) return cachedData;

    // Approx 21 business days per month
    const lastN = months * 22; 
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/${lastN}?formato=json`;

    try {
      const data: { data: string; valor: string }[] = await this.fetchWithRetry(url);
      
      const formatted = data.map(item => ({
        date: item.data, // DD/MM/YYYY
        value: parseFloat(item.valor) // BRL per 1 USD
      }));

      // Convert date to YYYY-MM-DD for consistency
      const standardized = formatted.map(item => {
        const [day, month, year] = item.date.split('/');
        return {
          date: `${year}-${month}-${day}`,
          value: item.value
        };
      });

      (this.cache as any).set(cacheKey, standardized);
      return standardized;
    } catch (error) {
      console.error('Failed to fetch USD/BRL series:', error);
      return [];
    }
  }

  /**
   * Retorna o benchmark de mercado (IPCA + 5%).
   */
  public async getMarketBenchmark(): Promise<number> {
    const ipca = await this.getAccumulatedIPCA();
    return ipca + 5.0;
  }
}

export const bacenIntegration = BacenIntegration.getInstance();
