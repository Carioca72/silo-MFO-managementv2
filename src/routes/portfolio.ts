import express from 'express';
import { portfolioScenarioService } from '../services/portfolio/portfolioScenarioService.js';
import { portfolioOptimizer } from '../services/math/portfolioOptimizer.js';
import { AssetData } from '../services/market/dataFetcher.js';

const router = express.Router();

// BUG-016: Rota para salvar um novo cenário de portfólio
router.post('/scenarios', async (req, res) => {
    const { clientId, scenario, notes } = req.body;

    if (!clientId || !scenario) {
        return res.status(400).json({ error: 'clientId e scenario são obrigatórios.' });
    }

    try {
        const savedScenario = await portfolioScenarioService.saveScenario(clientId, scenario, notes);
        if (savedScenario) {
            res.status(201).json(savedScenario);
        } else {
            res.status(500).json({ error: 'Falha ao salvar o cenário.' });
        }
    } catch (error) {
        console.error(`Erro em POST /api/portfolio/scenarios:`, error);
        res.status(500).json({ error: 'Erro interno ao salvar o cenário.' });
    }
});

// BUG-015: Rota para buscar os cenários de um cliente
router.get('/scenarios/:clientId', async (req, res) => {
    const { clientId } = req.params;

    try {
        const scenarios = await portfolioScenarioService.getScenariosByClientId(clientId);
        res.json(scenarios);
    } catch (error) {
        console.error(`Erro em GET /api/portfolio/scenarios/${clientId}:`, error);
        res.status(500).json({ error: 'Erro interno ao buscar os cenários.' });
    }
});

// Rota existente para otimização (mantida)
router.post('/optimize', async (req, res) => {
  const { assets, riskFreeRate, targetReturn } = req.body as { assets: AssetData[], riskFreeRate: number, targetReturn?: number };

  if (!assets || !riskFreeRate) {
    return res.status(400).json({ error: 'Assets e riskFreeRate são obrigatórios.' });
  }

  try {
    const scenarios = await portfolioOptimizer.optimize(assets, riskFreeRate, targetReturn);
    const points = await portfolioOptimizer.getEfficientFrontierPoints(assets, riskFreeRate, 20);
    
    res.json({ scenarios, efficientFrontier: points });

  } catch (error: any) {
    console.error('Erro na otimização de portfólio:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
