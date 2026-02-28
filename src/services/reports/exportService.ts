import * as XLSX from 'xlsx';
import { DetailedAsset, ProjectionResult } from '../../services/analysis/financialEngine';

const safeDiv = (numerator: number, denominator: number, defaultValue: number = 0): number => {
  if (denominator === 0 || !isFinite(denominator)) return defaultValue;
  const result = numerator / denominator;
  return isFinite(result) ? result : defaultValue;
};

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isFinite(num) ? num : defaultValue;
};

export const generateExcelReport = (
  currentAssets: DetailedAsset[],
  suggestedAssets: DetailedAsset[],
  currentProjection: ProjectionResult,
  suggestedProjection: ProjectionResult
) => {
  const wb = XLSX.utils.book_new();

  // Tab 1: Projeção 12 Meses (Suggested)
  const projectionData = suggestedProjection.monthly.map(m => ({
    'Mês': m.month,
    'Saldo Inicial': m.finalBalance - m.netReturn, // Approximation
    'Retorno Nominal': m.nominalReturn,
    'Custo': m.cost,
    'Retorno Bruto': m.grossReturn,
    'IR': m.ir,
    'Retorno Líquido': m.netReturn,
    'Saldo Final': m.finalBalance
  }));
  
  const wsProjection = XLSX.utils.json_to_sheet(projectionData);
  XLSX.utils.book_append_sheet(wb, wsProjection, "Projeção 12 Meses");

  // Tab 2: Comparativo
  const comparisonData = [
    {
      'Indicador': 'Retorno Nominal',
      'Atual': currentProjection.aggregated.totalNominalReturn,
      'Novo': suggestedProjection.aggregated.totalNominalReturn,
      'Δ R$': suggestedProjection.aggregated.totalNominalReturn - currentProjection.aggregated.totalNominalReturn,
      'Δ %': safeDiv(
        suggestedProjection.aggregated.totalNominalReturn - currentProjection.aggregated.totalNominalReturn,
        currentProjection.aggregated.totalNominalReturn,
        0
      )
    },
    {
      'Indicador': 'Custos',
      'Atual': currentProjection.aggregated.totalCosts,
      'Novo': suggestedProjection.aggregated.totalCosts,
      'Δ R$': suggestedProjection.aggregated.totalCosts - currentProjection.aggregated.totalCosts,
      'Δ %': safeDiv(
        suggestedProjection.aggregated.totalCosts - currentProjection.aggregated.totalCosts,
        currentProjection.aggregated.totalCosts,
        0
      )
    },
    {
      'Indicador': 'IR',
      'Atual': currentProjection.aggregated.totalIR,
      'Novo': suggestedProjection.aggregated.totalIR,
      'Δ R$': suggestedProjection.aggregated.totalIR - currentProjection.aggregated.totalIR,
      'Δ %': safeDiv(
        suggestedProjection.aggregated.totalIR - currentProjection.aggregated.totalIR,
        currentProjection.aggregated.totalIR,
        0
      )
    },
    {
      'Indicador': 'Retorno Líquido',
      'Atual': currentProjection.aggregated.totalNetReturn,
      'Novo': suggestedProjection.aggregated.totalNetReturn,
      'Δ R$': suggestedProjection.aggregated.totalNetReturn - currentProjection.aggregated.totalNetReturn,
      'Δ %': safeDiv(
        suggestedProjection.aggregated.totalNetReturn - currentProjection.aggregated.totalNetReturn,
        currentProjection.aggregated.totalNetReturn,
        0
      )
    },
    {
      'Indicador': 'Sharpe Ratio',
      'Atual': currentProjection.aggregated.sharpeRatio,
      'Novo': suggestedProjection.aggregated.sharpeRatio,
      'Δ R$': suggestedProjection.aggregated.sharpeRatio - currentProjection.aggregated.sharpeRatio,
      'Δ %': safeDiv(
        suggestedProjection.aggregated.sharpeRatio - currentProjection.aggregated.sharpeRatio,
        currentProjection.aggregated.sharpeRatio,
        0
      )
    }
  ];

  const wsComparison = XLSX.utils.json_to_sheet(comparisonData);
  XLSX.utils.book_append_sheet(wb, wsComparison, "Comparativo");

  // Write file
  XLSX.writeFile(wb, "Estudo_Carteira_Silo.xlsx");
};
