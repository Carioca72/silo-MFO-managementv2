import express from 'express';
import { clientService } from '../services/crm/clientService.js';

const router = express.Router();

// GET /api/clients
router.get('/', async (req, res) => {
  try {
      const clients = await clientService.getAll();
      res.json(clients);
  } catch (error) {
      console.error('Error in GET /api/clients:', error);
      res.status(500).json({ error: 'Failed to retrieve clients.' });
  }
});

// GET /api/clients/:id (FIX B-09)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const client = await clientService.getById(id);
        if (client) {
            res.json(client);
        } else {
            res.status(404).json({ error: `Client with id ${id} not found` });
        }
    } catch (error) {
        console.error(`Error in GET /api/clients/${id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve client.' });
    }
});

// POST /api/clients/sync
router.post('/sync', (req, res) => {
  res.json({ synced: 5, created: 1, updated: 4, lastSync: new Date() });
});

export default router;
