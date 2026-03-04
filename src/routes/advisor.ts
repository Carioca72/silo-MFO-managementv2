import { Router, Request, Response } from 'express';
import { siloAdvisor } from '../services/ai/siloAdvisor';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const aiResponse = await siloAdvisor.generateResponse(message, null, history || []);
        res.setHeader('Content-Type', 'text/plain');
        res.send(aiResponse);
    } catch (error) {
        console.error('Error in /chat endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
