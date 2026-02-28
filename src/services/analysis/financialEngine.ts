import { Asset } from '../../types/asset';

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isFinite(num) ? num : defaultValue;
};

export interface DetailedAsset extends Asset {
  institution: string;
  liquidity: number; // days
  strategy: 'Liquidez' | 'Crescimento' | 'Proteção';
  taxRate: number; // IR %
  adminFee: number; // % a.a
  returnRate: number; // % a.a or % CDI
  volatility: number; // % a.a
}

export interface ProjectionResult {
  monthly: {
    month: number;
    nominalReturn: number;
    cost: number;
    grossReturn: number;
    ir: number;
    netReturn: number;
    finalBalance: number;
  }[];
  aggregated: {
    totalNominalReturn: number;
    totalCosts: number;
    totalIR: number;
    totalNetReturn: number;
    returnPct: number;
    monthlyReturnPct: number;
    cdiPct: number;
    volatility: number;
    sharpeRatio: number;
  };
}

export class FinancialEngine {
  
  public calculateProjection(assets: DetailedAsset[], cdiRate: number, initialBalance: number): ProjectionResult {
    // Simplified projection logic
    // Assume constant monthly return based on asset returnRate
    // Assume constant monthly cost based on adminFee
    // Assume constant monthly IR based on taxRate (simplified)
    
    const monthlyData = [];
    let currentBalance = initialBalance;
    
    // Calculate weighted average return and cost
    let weightedReturn = 0;
    let weightedCost = 0;
    let weightedTax = 0;
    let weightedVol = 0;
    
    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
    
    assets.forEach(a => {
      const weight = a.value / totalValue;
      weightedReturn += (a.returnRate || 0) * weight;
      weightedCost += (a.adminFee || 0) * weight;
      weightedTax += (a.taxRate || 0) * weight;
      weightedVol += (a.volatility || 0) * weight; // Simplified linear vol (not correct but standard for simple projection)
    });
    
    const monthlyReturnRate = Math.pow(1 + weightedReturn, 1/12) - 1;
    const monthlyCostRate = Math.pow(1 + weightedCost, 1/12) - 1;
    
    let totalNominal = 0;
    let totalCosts = 0;
    let totalIR = 0;
    
    for (let i = 1; i <= 12; i++) {
      const nominalReturn = currentBalance * monthlyReturnRate;
      const cost = currentBalance * monthlyCostRate;
      const grossReturn = nominalReturn - cost;
      const ir = grossReturn > 0 ? grossReturn * weightedTax : 0;
      const netReturn = grossReturn - ir;
      
      currentBalance += netReturn;
      
      totalNominal += nominalReturn;
      totalCosts += cost;
      totalIR += ir;
      
      monthlyData.push({
        month: i,
        nominalReturn,
        cost,
        grossReturn,
        ir,
        netReturn,
        finalBalance: currentBalance
      });
    }
    
    const totalNetReturn = currentBalance - initialBalance;
    const returnPct = totalNetReturn / initialBalance;
    const monthlyReturnPct = Math.pow(1 + returnPct, 1/12) - 1;
    const cdiPct = returnPct / cdiRate; // Relative to CDI
    
    // Sharpe Ratio (Annualized)
    // Risk Free Rate (CDI) assumed as baseline for Sharpe calculation
    const excessReturn = returnPct - cdiRate;
    const sharpeRatio = weightedVol > 0 ? excessReturn / weightedVol : 0;

    return {
      monthly: monthlyData,
      aggregated: {
        totalNominalReturn: totalNominal,
        totalCosts,
        totalIR,
        totalNetReturn,
        returnPct,
        monthlyReturnPct,
        cdiPct,
        volatility: weightedVol,
        sharpeRatio
      }
    };
  }

  public calculateAssetCosts(asset: DetailedAsset): {
    annualCost: number;
    monthlyCost: number;
  } {
    const annualCost = (asset.value * asset.adminFee) / 100;
    const monthlyCost = annualCost / 12;
    
    return {
      annualCost: safeNumber(annualCost),
      monthlyCost: safeNumber(monthlyCost)
    };
  }

  public calculateNetReturn(asset: DetailedAsset, grossReturn: number): number {
    const ir = grossReturn * (asset.taxRate / 100);
    const adminFee = (asset.value * asset.adminFee) / 100 / 12; // Monthly
    const netReturn = grossReturn - ir - adminFee;
    
    return safeNumber(netReturn);
  }
}

export const financialEngine = new FinancialEngine();
