"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientService_js_1 = require("../services/crm/clientService.js");
const router = express_1.default.Router();
// POST /api/crm/webhook
router.post('/', (req, res) => {
    const event = req.body;
    console.log('CRM Webhook Received:', JSON.stringify(event, null, 2));
    // Process CRM events (e.g., stage changes)
    if (event.type === 'stage_change') {
        const { oldStage, newStage, clientId } = event.data;
        // Update local store
        const updatedClient = clientService_js_1.clientService.updateStage(clientId, newStage);
        // Trigger automation based on stage change
        // This could call the trigger engine or automation flow
        const io = global.io;
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
exports.default = router;
//# sourceMappingURL=crm-webhook.js.map