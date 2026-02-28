import { DetailedAsset } from './financialEngine';

export interface Diagnosis {
  rule: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export class DiagnosisEngine {
  
  public runDiagnosis(assets: DetailedAsset[]): Diagnosis[] {
    const diagnoses: Diagnosis[] = [];
    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
    
    // Rule 1: Concentration (> 20%)
    const concentratedAssets = assets.filter(a => (a.value / totalValue) > 0.20);
    if (concentratedAssets.length > 0) {
      diagnoses.push({
        rule: 'Concentração',
        message: 'Carteira apresenta concentração excessiva (oversized) em um único emissor.',
        severity: 'high'
      });
    }
    
    // Rule 2: Liquidity (> 40% daily)
    // Assuming liquidity <= 1 means daily
    const liquidAssets = assets.filter(a => a.liquidity <= 1);
    const liquidValue = liquidAssets.reduce((sum, a) => sum + a.value, 0);
    if ((liquidValue / totalValue) > 0.40) {
      diagnoses.push({
        rule: 'Liquidez',
        message: 'Elevada exposição em liquidez diária dificulta superar o CDI.',
        severity: 'medium'
      });
    }
    
    // Rule 3: Single Issuer
    // Check for duplicate institutions or specific issuer logic
    // Assuming 'institution' field is populated
    const issuers = assets.map(a => a.institution);
    const uniqueIssuers = new Set(issuers);
    if (uniqueIssuers.size === 1 && assets.length > 1) {
       diagnoses.push({
        rule: 'Emissor Único',
        message: 'Carteira possui ativos de emissor único (single name), indicando potencial conflito de interesse.',
        severity: 'high'
      });
    }
    
    return diagnoses;
  }
}

export const diagnosisEngine = new DiagnosisEngine();
