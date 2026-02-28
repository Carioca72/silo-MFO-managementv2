import express from 'express';
import { clientService } from '../services/crm/clientService.js';

const router = express.Router();

// GET /api/clients
router.get('/', (req, res) => {
  const clients = clientService.getAll();
  res.json(clients);
});

// POST /api/clients/sync
router.post('/sync', (req, res) => {
  res.json({ synced: 5, created: 1, updated: 4, lastSync: new Date() });
});

export default router;
