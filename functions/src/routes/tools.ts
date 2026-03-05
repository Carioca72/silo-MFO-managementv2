import express from 'express';

const router = express.Router();

// Mock data for tools, moved from the frontend
const MOCK_TOOLS = [
  { id:'ext022', name:'ExtratoCarteira022', cat:'Extrato', icon:'■', desc:'Extrato MFO completo: posição, liquidez, movimentação, gráficos' },
  { id:'ext023', name:'ExtratoCarteira023', cat:'Extrato', icon:'■', desc:'Extrato consolidado com evolução vs benchmarks CDI/IBOV' },
  { id:'ext024', name:'ExtratoCarteira024', cat:'Extrato', icon:'■', desc:'Extrato executivo com alocação por tipo e gestor' },
  { id:'pos001', name:'PosicaoConsolidada001', cat:'Posição', icon:'■', desc:'Posição consolidada com aportes, resgates e IR/IOF' },
  { id:'var001', name:'Value_at_Risk001', cat:'Risco', icon:'■■', desc:'VaR 95% histórico para portfólio multi-ativo' },
  { id:'mkw001', name:'Markowitz001', cat:'Otimização', icon:'■', desc:'Fronteira eficiente e portfólio ótimo de Markowitz' },
  { id:'rco001', name:'Risco001', cat:'Risco', icon:'■', desc:'Matriz de correlação, covariância e risco×retorno' },
  { id:'drw001', name:'DrawDownAcumulado001', cat:'Risco', icon:'■', desc:'Série histórica de drawdown acumulado pico a vale' },
  { id:'str001', name:'StressTest001', cat:'Risco', icon:'■', desc:'Stress test com cenários de choque de mercado' },
  { id:'est001', name:'AnaliseEstilo001', cat:'Atribuição', icon:'■', desc:'Style analysis do fundo vs IBOV/CDI/IMA-B' },
  { id:'dur001', name:'Duration001', cat:'Renda Fixa', icon:'■', desc:'Duration Macaulay, Modificada e DV01 por vértice' },
  { id:'rlq001', name:'RiscoLiquidez001', cat:'Liquidez', icon:'■', desc:'Prazo médio de liquidação e risco de liquidez' },
  { id:'ger002', name:'RelatorioGerencial002', cat:'Gerencial', icon:'■', desc:'Relatório gerencial mensal com eventos' },
  { id:'lam021', name:'LaminaFundo021', cat:'Fundos', icon:'■', desc:'Lâmina completa do fundo com retornos e benchmarks' },
];

// GET /api/tools - Returns the mock list of tools
router.get('/', (req, res) => {
  res.json(MOCK_TOOLS);
});

export default router;
