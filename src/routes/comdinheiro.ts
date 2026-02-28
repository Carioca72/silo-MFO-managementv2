import express from 'express';
import { COMDINHEIRO_ENDPOINTS } from '../services/comdinheiro/endpoints.js';

const router = express.Router();

// POST /api/cmd/query
router.post('/query', async (req, res) => {
  const { endpoint, params } = req.body;
  
  // Validation
  if (!COMDINHEIRO_ENDPOINTS[endpoint as keyof typeof COMDINHEIRO_ENDPOINTS]) {
    return res.status(400).json({ error: 'Endpoint inválido' });
  }

  // Real fetch implementation (ready for env vars)
  const API_URL = process.env.COMDINHEIRO_API_URL || 'https://api.comdinheiro.com.br/v2';
  const API_KEY = process.env.COMDINHEIRO_API_KEY;

  if (API_KEY) {
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error('ComDinheiro API Error:', error);
      // Fallback to mock if API fails or is not reachable
    }
  }

  // Mock response if no API key or fetch failed
  res.json({
    data: { mock: true, message: `Dados simulados para ${endpoint}`, params },
    cached: false,
    endpoint
  });
});

// GET /api/cmd/endpoints
router.get('/endpoints', (req, res) => {
  res.json(COMDINHEIRO_ENDPOINTS);
});

export default router;
