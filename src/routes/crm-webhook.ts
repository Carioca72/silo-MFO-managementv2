import express from 'express';
import { clientService } from '../services/crm/clientService.js';

const router = express.Router();

// POST /api/crm/webhook
router.post('/', (req, res) => {
  const event = req.body;
  
  console.log('CRM Webhook Received:', JSON.stringify(event, null, 2));
  
  // Process CRM events (e.g., stage changes)
  if (event.type === 'stage_change') {
    const { oldStage, newStage, clientId } = event.data;
    
    // Update local store
    const updatedClient = clientService.updateStage(clientId, newStage);
    
    // Trigger automation based on stage change
    // This could call the trigger engine or automation flow
    const io = (global as any).io;
    if (io) {
      io.emit('crm:stage_change', { 
        clientId, 
        oldStage, 
        newStage,
        client: updatedClient // Send updated client data
      });
    }
  }

  res.json({ received: true });
});

export default router;