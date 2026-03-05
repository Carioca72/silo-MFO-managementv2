"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const router = express_1.default.Router();
// POST /api/boletos/generate
router.post('/generate', async (req, res) => {
    const { system, clientData } = req.body;
    if (!system || !clientData) {
        return res.status(400).json({ error: 'system e clientData obrigatórios' });
    }
    try {
        // Puppeteer launch is kept for future use, but page creation is removed.
        await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        let boletoUrl = '';
        // Mock navigation logic based on system
        if (system === 'Porto') {
            // ... real logic would go here
            boletoUrl = 'https://porto.seguro/boleto/123456';
        }
        else if (system === 'Azos') {
            boletoUrl = 'https://azos.com.br/boleto/789012';
        }
        else {
            boletoUrl = `https://${system.toLowerCase()}.com/boleto/mock`;
        }
        // browser.close() is removed as browser is not being fully utilized.
        return res.json({
            success: true,
            boletoUrl,
            system,
            generatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Boleto Generation Error:', error);
        return res.status(500).json({ error: 'Falha ao gerar boleto: ' + error.message });
    }
});
exports.default = router;
//# sourceMappingURL=boletos.js.map