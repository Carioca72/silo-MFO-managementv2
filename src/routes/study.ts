import express from 'express';
import { marketDataAggregator } from '../services/market/marketDataAggregator.js';
import { markowitzService } from '../services/math/markowitz.js';
import { excelGenerator } from '../services/reports/excelGenerator.js';

const router = express.Router();

// GET /api/study/market-data?tickers=PETR4,VALE3
router.get('/market-data', async (req, res) => {
  const tickers = (req.query.tickers as string)?.split(',');
  if (!tickers || tickers.length === 0) {
    return res.status(400).json({ error: 'Tickers required' });
  }

  try {
    const quotes = await marketDataAggregator.getMonthlyQuotes(tickers);
    res.json(quotes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/study/optimize
router.post('/optimize', (req, res) => {
  const { assets, riskFreeRate, constraints } = req.body;
  if (!assets) return res.status(400).json({ error: 'Assets required' });

  try {
    const result = markowitzService.optimize(assets, riskFreeRate || 10.5, constraints || { minWeight: 0, maxWeight: 1 });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/study/generate-excel
router.post('/generate-excel', async (req, res) => {
  try {
    const buffer = await excelGenerator.generateStudyExcel(req.body);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=estudo_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study/models
router.get('/models', (req, res) => {
  // In a real app, this would come from a DB
  const models = [
    { 
      id: 'conservador', 
      name: 'Conservador (CDI+)', 
      description: 'Foco em preservação de capital e liquidez.',
      allocation: [
        { class: 'Renda Fixa Pós', weight: 0.60 },
        { class: 'Renda Fixa Pré', weight: 0.20 },
        { class: 'Inflação', weight: 0.20 }
      ]
    },
    { 
      id: 'moderado', 
      name: 'Moderado (Multimercado)', 
      description: 'Equilíbrio entre risco e retorno.',
      allocation: [
        { class: 'Renda Fixa Pós', weight: 0.40 },
        { class: 'Multimercado', weight: 0.30 },
        { class: 'Ações', weight: 0.15 },
        { class: 'Internacional', weight: 0.15 }
      ]
    },
    { 
      id: 'arrojado', 
      name: 'Arrojado (Equity)', 
      description: 'Maximização de retorno no longo prazo.',
      allocation: [
        { class: 'Renda Fixa', weight: 0.20 },
        { class: 'Ações Brasil', weight: 0.40 },
        { class: 'Ações Global', weight: 0.30 },
        { class: 'Alternativos', weight: 0.10 }
      ]
    }
  ];
  res.json(models);
});

export default router;