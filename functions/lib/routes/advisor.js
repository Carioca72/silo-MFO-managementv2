"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { siloAdvisor } from '../services/ai/siloAdvisor';
const router = (0, express_1.Router)();
router.post('/chat', async (req, res) => {
    // const { message, history } = req.body;
    // if (!message) {
    //     return res.status(400).json({ error: 'Message is required' });
    // }
    // try {
    //     // Configura os headers para uma resposta de streaming
    //     res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    //     res.setHeader('Transfer-Encoding', 'chunked');
    //     const stream = siloAdvisor.generateResponse(message, null, history || []);
    //     for await (const chunk of stream) {
    //         res.write(chunk);
    //     }
    //     res.end(); // Finaliza a resposta de streaming
    // } catch (error) {
    //     console.error('Error in /chat endpoint:', error);
    //     // Se um erro ocorrer, tenta enviar uma resposta de erro JSON.
    //     // Isso pode falhar se o streaming já começou, mas é a melhor tentativa.
    //     if (!res.headersSent) {
    //         res.status(500).json({ error: 'Internal server error' });
    //     }
    // }
    res.status(503).send('Service temporarily unavailable');
});
exports.default = router;
//# sourceMappingURL=advisor.js.map