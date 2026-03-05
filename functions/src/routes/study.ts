import { Router } from 'express';

const router = Router();

// --- Mock de Dados Detalhado para um Estudo Específico ---
const detailedStudyMock = {
  id: 'clwvc7e53000008l71cl93t7a',
  name: 'Análise de Carteira XP - Março/2024',
  clientName: 'João da Silva',
  type: 'Estudo de Carteira',
  status: 'Concluído',
  createdAt: '2024-03-15T10:30:00.000Z',
  analysisResult: {
    original_filename: 'XP_Mar2024.pdf',
    diagnostics: [
      'Concentração elevada no ativo FII XPTO11 (35%).',
      'Baixa exposição a mercados internacionais (5%).',
      'Índice de Sharpe abaixo do benchmark (0.8 vs 1.2 CDI).',
      'Potencial de otimização via diversificação em Renda Fixa Global.'
    ],
    current_scenario: {
      portfolio: [
        { name: 'Renda Fixa Pós', value: 250000, category: 'RF' },
        { name: 'FII XPTO11', value: 350000, category: 'FII' },
        { name: 'Ações Nacionais', value: 200000, category: 'RV' },
        { name: 'Ações Internacionais', value: 50000, category: 'RV Int' },
        { name: 'Caixa', value: 150000, category: 'Caixa' },
      ],
      aggregated_indicators: {
        retorno_anual: 0.10,
        volatilidade_anual: 0.12,
        sharpe: 0.8,
      },
      projections: [ { month: 0, value: 100 }, { month: 12, value: 110 } ]
    },
    new_scenario: {
       portfolio: [
        { name: 'Renda Fixa Pós', value: 200000, category: 'RF' },
        { name: 'Renda Fixa Global', value: 200000, category: 'RF Int' },
        { name: 'FII XPTO11', value: 150000, category: 'FII' },
        { name: 'Ações Nacionais', value: 200000, category: 'RV' },
        { name: 'Ações Internacionais', value: 200000, category: 'RV Int' },
        { name: 'Caixa', value: 50000, category: 'Caixa' },
      ],
      aggregated_indicators: {
        retorno_anual: 0.14,
        volatilidade_anual: 0.11,
        sharpe: 1.25,
      },
      projections: [ { month: 0, value: 100 }, { month: 12, value: 114 } ]
    },
    comparison_summary: {},
  },
};

// A lista principal agora só precisa de resumos
const mockStudies = [
  {
    id: 'clwvc7e53000008l71cl93t7a',
    name: 'Análise de Carteira XP - Março/2024',
    clientName: 'João da Silva',
    type: 'Estudo de Carteira',
    status: 'Concluído',
    createdAt: '2024-03-15T10:30:00.000Z',
    analysisResult: { original_filename: 'XP_Mar2024.pdf' },
  },
  // ... outros estudos resumidos ...
];

// --- Rotas ---

// GET /api/studies - Retorna a lista de resumos
router.get('/', (_req, res) => res.status(200).json(mockStudies));

// GET /api/studies/:id - Retorna o estudo *detalhado* completo
router.get('/:id', (req, res) => {
  if (req.params.id === detailedStudyMock.id) {
    res.status(200).json(detailedStudyMock);
  } else {
    res.status(404).json({ message: 'Study not found.' });
  }
});

// PATCH /api/studies/:id
router.patch('/:id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'New name is required.' });
  const studyIndex = mockStudies.findIndex(s => s.id === req.params.id);
  if (studyIndex !== -1) {
    mockStudies[studyIndex].name = name;
    res.status(200).json(mockStudies[studyIndex]);
  } else {
    res.status(404).json({ message: 'Study not found.' });
  }
});

// POST /api/studies/:id/reanalyze
router.post('/:id/reanalyze', (req, res) => {
  const studyIndex = mockStudies.findIndex(s => s.id === req.params.id);
  if (studyIndex !== -1) {
    mockStudies[studyIndex].status = 'Em Andamento';
    res.status(202).json(mockStudies[studyIndex]);
    setTimeout(() => {
      mockStudies[studyIndex].status = 'Concluído';
    }, 4000);
  } else {
    res.status(404).json({ message: 'Study not found.' });
  }
});

export default router;
