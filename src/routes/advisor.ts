import { Router, Request, Response } from 'express';
import { siloAdvisorService } from '../../services/siloAdvisor';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const aiResponse = await siloAdvisorService.generateResponse(message);
        res.json({ response: aiResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
