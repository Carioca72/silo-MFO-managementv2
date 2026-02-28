import { DetailedAsset } from './financialEngine';

export class DiagnosisEngine {
  
  checkForConcentration(portfolio: DetailedAsset[]): {
    hasConcentration: boolean;
    text: string;
    offendingAssets: string[];
  } {
    const totalValue = portfolio.reduce((sum, a) => sum + a.value, 0);
    const offendingAssets: string[] = [];
    
    portfolio.forEach(asset => {
      const weight = asset.value / totalValue;
      if (weight > 0.20) { // > 20%
        offendingAssets.push(asset.titulo);
      }
    });
    
    if (offendingAssets.length > 0) {
      return {
        hasConcentration: true,
        text: `Observamos uma concentração elevada em ${offendingAssets.join(', ')}, o que representa um risco não diversificado (Oversized). Sugerimos a re-alocação para mitigar este risco.`,
        offendingAssets
      };
    }
    
    return {
      hasConcentration: false,
      text: '',
      offendingAssets: []
    };
  }
  
  checkForLiquidityDrag(portfolio: DetailedAsset[]): {
    hasLiquidityDrag: boolean;
    text: string;
    liquidityPercentage: number;
  } {
    const totalValue = portfolio.reduce((sum, a) => sum + a.value, 0);
    const liquidAssets = portfolio.filter(a => a.liquidity === 0); // D+0
    const liquidityPercentage = liquidAssets.reduce((sum, a) => sum + a.value, 0) / totalValue;
    
    if (liquidityPercentage > 0.40) { // > 40%
      return {
        hasLiquidityDrag: true,
        text: `A carteira possui um percentual elevado de ativos com liquidez diária (${(liquidityPercentage * 100).toFixed(1)}%), o que pode dificultar a obtenção de retornos acima do CDI no longo prazo. Avaliaremos oportunidades com prazos maiores e rentabilidade superior.`,
        liquidityPercentage
      };
    }
    
    return {
      hasLiquidityDrag: false,
      text: '',
      liquidityPercentage
    };
  }
}
