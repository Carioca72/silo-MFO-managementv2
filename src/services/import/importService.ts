import * as XLSX from 'xlsx';
import { DetailedAsset } from '../analysis/financialEngine';

export interface DataQualityLog {
  asset: string;
  field: string;
  status: 'found' | 'inferred' | 'missing';
  message: string;
}

export interface ImportResult {
  assets: DetailedAsset[];
  totalValue: number;
  logs: DataQualityLog[];
}

export class ImportService {

  public parseData(data: any[][]): ImportResult {
    const assets: DetailedAsset[] = [];
    const logs: DataQualityLog[] = [];
    let totalValue = 0;

    // Log raw data for debugging
    console.log('Raw Import Data (First 5 rows):', data.slice(0, 5));

    const rawAssets = data.map((row, index) => {
      // Skip empty rows or rows without enough columns
      if (!row || row.length < 6) return null;

      // Try to identify if it's a header row
      const col0 = String(row[0]).toLowerCase();
      if (col0.includes('instituição') || col0.includes('instituicao')) return null;

      const institution = String(row[0]).trim();
      const assetClass = String(row[1]).trim();
      const assetName = String(row[2]).trim();
      const valueRaw = row[5];

      // Sanitization
      const value = this.parseValue(valueRaw);
      
      if (value <= 0) {
          // Log skipped row if it looked like data but value was 0
          if (assetName && assetName.length > 2) {
             console.warn(`Skipping row ${index}: Invalid value for ${assetName}`);
          }
          return null;
      }

      totalValue += value;

      return {
        institution,
        assetClass,
        assetName,
        value
      };
    }).filter(a => a !== null);

    if (rawAssets.length === 0) {
        throw new Error('Nenhum ativo válido encontrado. Verifique o mapeamento das colunas (0: Inst, 1: Classe, 2: Ativo, 5: Valor).');
    }

    // Second pass for enrichment and normalization
    rawAssets.forEach((raw, index) => {
      if (!raw) return;

      const pct = raw.value / totalValue;
      
      // Gap Filling & Classification
      const normalizedClass = this.normalizeClass(raw.assetClass, raw.assetName);
      const enrichment = this.enrichAssetData(normalizedClass, raw.assetName);
      
      // Log Data Quality
      logs.push(...enrichment.logs.map(l => ({ ...l, asset: raw.assetName })));

      assets.push({
        id: `import-${index}`,
        ticker: enrichment.ticker || raw.assetName, // Use mapped ticker or name
        name: raw.assetName,
        class: normalizedClass,
        value: raw.value,
        pct: pct,
        institution: raw.institution,
        liquidity: enrichment.liquidity,
        strategy: enrichment.strategy,
        taxRate: enrichment.taxRate,
        adminFee: enrichment.adminFee,
        volatility: enrichment.volatility,
        returnRate: enrichment.returnRate,
        price: raw.value 
      });
    });

    // Precision Check
    // In JS float math, exact cent matching can be tricky. 
    // We round totalValue to 2 decimals for display/check.
    const precisionCheck = Math.round(totalValue * 100) / 100;
    console.log(`Total Value Imported: ${precisionCheck}`);

    return { assets, totalValue: precisionCheck, logs };
  }

  private parseValue(raw: any): number {
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      // Remove R$, spaces
      let clean = raw.replace(/[R$\s]/g, '');
      // Handle Brazilian format: 50.000,00 -> 50000.00
      // If there are dots and commas, assume dot is thousand separator and comma is decimal
      if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else if (clean.includes(',')) {
        // If only comma, assume decimal
        clean = clean.replace(',', '.');
      }
      // If only dot, it could be thousand separator (50.000) or decimal (50.00). 
      // Usually in BR, dot is thousand. But let's be careful.
      // If it has 3 digits after dot, likely thousand. 
      
      const val = parseFloat(clean);
      return isNaN(val) ? 0 : val;
    }
    return 0;
  }

  private normalizeClass(rawClass: string, assetName: string): string {
    const upperName = assetName.toUpperCase();
    const upperClass = rawClass.toUpperCase();

    if (upperName.includes('CRI') || upperName.includes('CRA') || upperName.includes('DEB')) {
      return 'Crédito Privado';
    }
    
    if (upperName.endsWith('11')) {
      if (upperClass.includes('FII') || upperName.includes('FII')) return 'FII';
      if (upperClass.includes('ETF') || upperName.includes('ETF')) return 'ETF';
      // Default to FII if ambiguous but ends in 11 and not clearly ETF
      return 'FII'; 
    }

    if (upperClass.includes('AÇÕES') || upperClass.includes('ACOES')) return 'Ações';
    if (upperClass.includes('RENDA FIXA') || upperClass.includes('TESOURO')) return 'Renda Fixa';
    if (upperClass.includes('MULTIMERCADO')) return 'Multimercado';

    return rawClass || 'Outros';
  }

  private enrichAssetData(assetClass: string, assetName: string) {
    const logs: Omit<DataQualityLog, 'asset'>[] = [];
    
    // Defaults
    let liquidity = 30; 
    let strategy: 'Liquidez' | 'Crescimento' | 'Proteção' = 'Crescimento';
    let taxRate = 0.15;
    let adminFee = 0.0;
    let volatility = 0.10; 
    let returnRate = 0.11; 
    let ticker: string | undefined = undefined;

    const upperClass = assetClass.toUpperCase();
    const upperName = assetName.toUpperCase();

    // Real Proxy Mapping Logic
    if (upperClass === 'FII' || upperName.includes('KINEA')) {
        if (upperName.includes('KINEA') && !upperName.includes('KNIP11')) {
            ticker = 'KNIP11.SA'; // Proxy mapping
            logs.push({ field: 'Ticker', status: 'inferred', message: `Mapeado '${assetName}' para proxy 'KNIP11.SA'` });
        }
    }

    // Tax & Strategy Rules
    if (upperClass === 'AÇÕES') {
      taxRate = 0.15;
      strategy = 'Crescimento';
      liquidity = 2;
      volatility = 0.25;
      returnRate = 0.15;
    } else if (upperClass === 'FII') {
      taxRate = 0.20; 
      strategy = 'Crescimento'; 
      liquidity = 2;
      volatility = 0.15;
      returnRate = 0.12;
    } else if (upperClass === 'RENDA FIXA' || upperClass === 'LCI' || upperClass === 'LCA') {
      if (upperClass.includes('LCI') || upperClass.includes('LCA')) {
        taxRate = 0.0;
        logs.push({ field: 'Tributação', status: 'found', message: 'Isento (LCI/LCA)' });
      } else {
        taxRate = 0.15; 
        logs.push({ field: 'Tributação', status: 'inferred', message: 'Usando 15% (Tabela Regressiva Longo Prazo)' });
      }
      strategy = 'Proteção';
      liquidity = 0; 
      volatility = 0.02;
      returnRate = 0.105; 
    } else if (upperClass === 'CRÉDITO PRIVADO') {
      taxRate = 0.15;
      strategy = 'Crescimento';
      liquidity = 365; 
      logs.push({ field: 'Liquidez', status: 'inferred', message: 'Usando D+365 (Estimado para Crédito Privado)' });
      volatility = 0.05;
      returnRate = 0.12; 
    }

    // Strategy Override based on Liquidity
    if (liquidity < 30) strategy = 'Proteção'; 
    else if (liquidity > 360) strategy = 'Crescimento';

    let finalStrategy: 'Liquidez' | 'Crescimento' | 'Proteção' = 'Crescimento';
    if (strategy === 'Proteção') finalStrategy = 'Proteção'; 
    if (liquidity < 30) finalStrategy = 'Liquidez';
    else if (liquidity > 360) finalStrategy = 'Crescimento';
    else finalStrategy = 'Proteção'; 

    return { liquidity, strategy: finalStrategy, taxRate, adminFee, volatility, returnRate, ticker, logs };
  }
}

export const importService = new ImportService();
