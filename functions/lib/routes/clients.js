"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Mock data that was previously in the frontend
const MOCK_CLIENTS = [
    { id: '1', nome: 'Família Andrade', cnpj: '12.345.678/0001-90', portfolio: 'andrade_main', email: 'gestao@andrade.com.br', telefone: '+55 81 99999-0001', aum: 'R$ 12,4M', perfil: 'Moderado' },
    { id: '2', nome: 'Instituto Brennand', cnpj: '23.456.789/0001-12', portfolio: 'brennand_fundo', email: 'financeiro@brennand.org', telefone: '+55 81 99999-0002', aum: 'R$ 8,7M', perfil: 'Conservador' },
    { id: '3', nome: 'Holding Cerqueira', cnpj: '34.567.890/0001-23', portfolio: 'cerqueira_holding', email: 'diretoria@cerqueira.com', telefone: '+55 81 99999-0003', aum: 'R$ 21,3M', perfil: 'Arrojado' },
    { id: '4', nome: 'Família Magalhães', cnpj: '56.789.012/0001-45', portfolio: 'magalhaes_fam', email: 'patrimonial@magalhaes.com', telefone: '+55 81 99999-0005', aum: 'R$ 15,8M', perfil: 'Moderado' },
];
// GET /api/clients - Now returns the mock data
router.get('/', (req, res) => {
    res.json(MOCK_CLIENTS);
});
// GET /api/clients/:id - Also uses mock data
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const client = MOCK_CLIENTS.find(c => c.id === id);
    if (client) {
        res.json(client);
    }
    else {
        res.status(404).json({ error: `Client with id ${id} not found` });
    }
});
// Dummy endpoints to prevent errors, they don't do anything.
router.delete('/:id', (req, res) => {
    res.status(204).send();
});
router.post('/sync', (req, res) => {
    res.json({ synced: 4, created: 0, updated: 4, lastSync: new Date() });
});
exports.default = router;
//# sourceMappingURL=clients.js.map