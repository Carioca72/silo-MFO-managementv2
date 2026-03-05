import { Router } from 'express';

const router = Router();

// --- Mock Data for Markowitz Analysis ---
const mockMarkowitzResult = {
  analysisType: 'Markowitz001',
  efficientFrontier: [
    { risk: 0.05, return: 0.08, label: 'P1' },
    { risk: 0.07, return: 0.12, label: 'P2' },
    { risk: 0.10, return: 0.15, label: 'P_Otimo' },
    { risk: 0.15, return: 0.18, label: 'P4' },
    { risk: 0.20, return: 0.20, label: 'P5' },
  ],
  optimalPortfolio: {
    risk: 0.10,
    return: 0.15,
    sharpe: 1.5,
    allocation: [
      { asset: 'Ações Nacionais', ticker: 'BOVA11', weight: 0.40 },
      { asset: 'Renda Fixa Global', ticker: 'BNDW', weight: 0.30 },
      { asset: 'Ações Internacionais', ticker: 'IVV', weight: 0.20 },
      { asset: 'Ouro', ticker: 'GOLD11', weight: 0.10 },
    ]
  },
  summary: 'A carteira ótima, com Sharpe de 1.5, foi encontrada com 10% de risco e 15% de retorno. A alocação sugerida prioriza Ações Nacionais (40%) e Renda Fixa Global (30%).'
};


// POST /api/reports/generate - Generate a new report
router.post('/generate', (req, res) => {
  const { tools } = req.body;

  if (tools && tools.includes('mkw001')) {
    console.log('Ferramenta Markowitz detectada. Retornando análise simulada.');
    setTimeout(() => {
      res.status(200).json({
        message: 'Análise de Markowitz concluída com sucesso!',
        reportId: `rep_mkw_${new Date().getTime()}`,
        status: 'completed',
        result: mockMarkowitzResult 
      });
    }, 2000);
  } else {
    res.status(200).json({ 
      message: 'Solicitação de geração de relatório recebida com sucesso!',
      reportId: `rep_${new Date().getTime()}`,
      status: 'in_progress'
    });
  }
});

// GET /api/reports/:id - Retrieve details for a specific report
router.get('/:id', (req, res) => {
  const { id } = req.params;
  console.log(`Buscando detalhes para o relatório ${id}`);

  // In a real application, you would fetch the report from a database.
  // For now, we return the same mock Markowitz result for any valid-looking ID.
  if (id.startsWith('rep_mkw')) {
    res.status(200).json({
      message: 'Detalhes do relatório recuperados com sucesso.',
      reportId: id,
      status: 'completed',
      result: mockMarkowitzResult
    });
  } else {
    res.status(404).json({ message: `Relatório com ID ${id} não encontrado.` });
  }
});

export default router;
