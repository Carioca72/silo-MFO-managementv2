
import express from 'express';
import multer from 'multer';
import { pythonAgentService } from '../services/ai/pythonAgentService.js';
import { marketDataAggregator } from '../services/market/marketDataAggregator.js';
// Otimizador de Markowitz refatorado sendo importado
import { portfolioOptimizer } from '../services/math/portfolioOptimizer.js';
import { excelGenerator } from '../services/reports/excelGenerator.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/study/upload-and-analyze
router.post('/upload-and-analyze', upload.single('portfolioFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado. O arquivo deve ser enviado no campo \'portfolioFile\'.' });
  }

  try {
    const result = await pythonAgentService.analyzePortfolioFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json(result);
  } catch (error: any) {
    // Erros do Python Agent podem ser erros de servidor ou de input
    res.status(500).json({ error: error.message });
  }
});

// GET /api/study/market-data?tickers=PETR4,VALE3
router.get('/market-data', async (req, res) => {
  const tickers = (req.query.tickers as string)?.split(',');
  if (!tickers || tickers.length === 0) {
    return res.status(400).json({ error: 'Tickers são obrigatórios' });
  }

  try {
    const quotes = await marketDataAggregator.getMonthlyQuotes(tickers);
    res.json(quotes);
  } catch (error: any) {
    res.status(500).json({ error: `Erro interno do servidor: ${error.message}` });
  }
});

// POST /api/study/optimize
// Este endpoint agora usa diretamente o portfolioOptimizer refatorado.
router.post('/optimize', async (req, res) => {
  const { assets, riskFreeRate, targetReturn } = req.body;

  if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ message: 'O campo \'assets\' é obrigatório e deve ser um array não vazio.' });
  }
  if (typeof riskFreeRate !== 'number') {
      return res.status(400).json({ message: 'O campo \'riskFreeRate\' é obrigatório e deve ser um número.' });
  }

  try {
    // Chamada direta para o novo otimizador robusto
    const scenarios = await portfolioOptimizer.optimize(assets, riskFreeRate, targetReturn);
    res.json(scenarios);
  } catch (error: any) {
    // Se for um erro lançado pela nossa validação (falta de dados, etc.)
    // Retornamos 422 - Unprocessable Entity
    // Este é o comportamento "fail-fast" que queríamos.
    console.error(`Falha na otimização de portfólio: ${error.message}`);
    res.status(422).json({ 
        error: "A otimização falhou devido a dados de entrada inválidos ou insuficientes.",
        details: error.message // A mensagem de erro específica do otimizador
    });
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
    res.status(500).json({ error: `Erro ao gerar o arquivo Excel: ${error.message}` });
  }
});

// GET /api/study/models
router.get('/models', (req, res) => {
  const models = [
    { id: 'conservador', name: 'Conservador (CDI+)', description: 'Foco em preservação de capital e liquidez.', allocation: [{ class: 'Renda Fixa Pós', weight: 0.60 }, { class: 'Renda Fixa Pré', weight: 0.20 }, { class: 'Inflação', weight: 0.20 }] },
    { id: 'moderado', name: 'Moderado (Multimercado)', description: 'Equilíbrio entre risco e retorno.', allocation: [{ class: 'Renda Fixa Pós', weight: 0.40 }, { class: 'Multimercado', weight: 0.30 }, { class: 'Ações', weight: 0.15 }, { class: 'Internacional', weight: 0.15 }] },
    { id: 'arrojado', name: 'Arrojado (Equity)', description: 'Maximização de retorno no longo prazo.', allocation: [{ class: 'Renda Fixa', weight: 0.20 }, { class: 'Ações Brasil', weight: 0.40 }, { class: 'Ações Global', weight: 0.30 }, { class: 'Alternativos', weight: 0.10 }] }
  ];
  res.json(models);
});

export default router;
