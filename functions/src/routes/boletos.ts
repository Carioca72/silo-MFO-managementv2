import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

// POST /api/boletos/generate
router.post('/generate', async (req, res) => {
  const { system, clientData } = req.body;
  
  if (!system || !clientData) {
    return res.status(400).json({ error: 'system e clientData obrigatórios' });
  }

  try {
    // Puppeteer launch is kept for future use, but page creation is removed.
    await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let boletoUrl = '';

    // Mock navigation logic based on system
    if (system === 'Porto') {
      // ... real logic would go here
      boletoUrl = 'https://porto.seguro/boleto/123456';
    } else if (system === 'Azos') {
      boletoUrl = 'https://azos.com.br/boleto/789012';
    } else {
      boletoUrl = `https://${system.toLowerCase()}.com/boleto/mock`;
    }

    // browser.close() is removed as browser is not being fully utilized.

    return res.json({ 
      success: true, 
      boletoUrl, 
      system, 
      generatedAt: new Date().toISOString() 
    });

  } catch (error: any) {
    console.error('Boleto Generation Error:', error);
    return res.status(500).json({ error: 'Falha ao gerar boleto: ' + error.message });
  }
});

export default router;