"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientService_js_1 = require("../services/crm/clientService.js");
const router = express_1.default.Router();
// GET /api/clients
router.get('/', async (req, res) => {
    try {
        const clients = await clientService_js_1.clientService.getAll();
        res.json(clients);
    }
    catch (error) {
        console.error('Error in GET /api/clients:', error);
        res.status(500).json({ error: 'Failed to retrieve clients.' });
    }
});
// GET /api/clients/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const client = await clientService_js_1.clientService.getById(id);
        if (client) {
            res.json(client);
        }
        else {
            res.status(404).json({ error: `Client with id ${id} not found` });
        }
    }
    catch (error) {
        console.error(`Error in GET /api/clients/${id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve client.' });
    }
});
// BUG-013: Adicionar endpoint de deleção de cliente
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await clientService_js_1.clientService.deleteById(id);
        if (result.success) {
            res.status(204).send(); // Sucesso, sem conteúdo
        }
        else {
            // Se a mensagem indicar que não foi encontrado, retorna 404
            if (result.message && result.message.includes('não encontrado')) {
                res.status(404).json({ error: result.message });
            }
            else {
                // Outros erros de serviço
                res.status(500).json({ error: result.message || 'Falha ao deletar o cliente.' });
            }
        }
    }
    catch (error) {
        console.error(`Error in DELETE /api/clients/${id}:`, error);
        res.status(500).json({ error: 'Falha interna ao tentar deletar o cliente.' });
    }
});
// POST /api/clients/sync
router.post('/sync', (req, res) => {
    res.json({ synced: 5, created: 1, updated: 4, lastSync: new Date() });
});
exports.default = router;
//# sourceMappingURL=clients.js.map