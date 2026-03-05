"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const endpoints_js_1 = require("../services/comdinheiro/endpoints.js");
const router = express_1.default.Router();
// POST /api/cmd/query
router.post('/query', async (req, res) => {
    const { endpoint, params } = req.body;
    // Validation
    if (!endpoints_js_1.COMDINHEIRO_ENDPOINTS[endpoint]) {
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
        }
        catch (error) {
            console.error('ComDinheiro API Error:', error);
            // Fallback to mock if API fails or is not reachable
        }
    }
    // Mock response if no API key or fetch failed
    return res.json({
        data: { mock: true, message: `Dados simulados para ${endpoint}`, params },
        cached: false,
        endpoint
    });
});
// GET /api/cmd/endpoints
router.get('/endpoints', (_, res) => {
    return res.json(endpoints_js_1.COMDINHEIRO_ENDPOINTS);
});
exports.default = router;
//# sourceMappingURL=comdinheiro.js.map