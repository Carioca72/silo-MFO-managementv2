import { Router, Request, Response } from 'express';
import { siloAdvisor } from '../services/ai/siloAdvisor';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Configura os headers para uma resposta de streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const stream = siloAdvisor.generateResponse(message, null, history || []);

        for await (const chunk of stream) {
            res.write(chunk);
        }

        res.end(); // Finaliza a resposta de streaming

    } catch (error) {
        console.error('Error in /chat endpoint:', error);
        // Se um erro ocorrer, tenta enviar uma resposta de erro JSON.
        // Isso pode falhar se o streaming já começou, mas é a melhor tentativa.
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
