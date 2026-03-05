"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
let jobs = [
    { id: 'j1', nome: 'Relatorio Mensal — Todos os Clientes',
        cronExpr: '0 9 28 * *', active: true,
        nodes: [
            { id: 'n1', type: 'trigger_cron', label: 'Trigger Cron' },
            { id: 'n2', type: 'datacrazy', label: 'Buscar Clientes' },
            { id: 'n3', type: 'comdinheiro', label: 'ExtratoCarteira022', config: { endpoint: 'ExtratoCarteira022' } },
            { id: 'n4', type: 'ai', label: 'Gemini: Narrativa' },
            { id: 'n5', type: 'generate_pdf', label: 'Gerar PDF Branded' },
            { id: 'n6', type: 'send_email', label: 'Enviar E-mail' },
            { id: 'n7', type: 'send_wa', label: 'Enviar WhatsApp' },
        ],
        lastRun: '2026-01-28T09:00:00Z', nextRun: '2026-02-28T09:00:00Z',
        status: 'idle', createdAt: '2026-01-01T00:00:00Z', executions: [] },
    { id: 'j2', nome: 'Alerta VaR Semanal', cronExpr: '0 8 * * 1', active: true,
        nodes: [
            { id: 'n1', type: 'trigger_cron', label: 'Trigger Cron' },
            { id: 'n2', type: 'comdinheiro', label: 'Value_at_Risk001', config: { endpoint: 'Value_at_Risk001', threshold: 2.5 } },
            { id: 'n3', type: 'condition', label: 'Se VaR > 2.5%' },
            { id: 'n4', type: 'send_wa', label: 'WhatsApp Alerta' },
        ],
        lastRun: '2026-02-17T08:00:00Z', nextRun: '2026-02-24T08:00:00Z',
        status: 'idle', createdAt: '2026-01-01T00:00:00Z', executions: [] },
];
router.get('/', (_, res) => res.json(jobs));
router.get('/:id', (req, res) => {
    const job = jobs.find(j => j.id === req.params.id);
    if (!job)
        return res.status(404).json({ error: 'Nao encontrado' });
    return res.json(job);
});
router.post('/', (req, res) => {
    const { nome, cronExpr, nodes = [] } = req.body;
    if (!nome)
        return res.status(400).json({ error: 'nome obrigatorio' });
    const job = { id: 'j' + Date.now(), nome, cronExpr: cronExpr || 'manual',
        active: false, nodes, status: 'idle', createdAt: new Date().toISOString(), executions: [] };
    jobs.push(job);
    return res.status(201).json(job);
});
router.put('/:id', (req, res) => {
    const idx = jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ error: 'Nao encontrado' });
    jobs[idx] = { ...jobs[idx], ...req.body, id: req.params.id };
    return res.json(jobs[idx]);
});
router.post('/:id/toggle', (req, res) => {
    const job = jobs.find(j => j.id === req.params.id);
    if (!job)
        return res.status(404).json({ error: 'Nao encontrado' });
    job.active = !job.active;
    const io = global.io;
    if (io)
        io.emit('automation:toggle', { id: job.id, active: job.active });
    return res.json({ id: job.id, active: job.active });
});
router.post('/:id/run', async (req, res) => {
    const job = jobs.find(j => j.id === req.params.id);
    if (!job)
        return res.status(404).json({ error: 'Nao encontrado' });
    if (job.status === 'running')
        return res.status(409).json({ error: 'Ja em execucao' });
    job.status = 'running';
    const exec = { id: 'ex' + Date.now(), status: 'running',
        startedAt: new Date().toISOString(), log: ['Execucao iniciada...'] };
    job.executions.unshift(exec);
    const io = global.io;
    (async () => {
        for (const node of job.nodes) {
            exec.log.push(`Executando: ${node.label}`);
            if (io)
                io.emit(`automation:progress:${job.id}`, { nodeId: node.id, label: node.label, log: exec.log });
            await new Promise(r => setTimeout(r, 900));
        }
        job.status = 'idle';
        job.lastRun = new Date().toISOString();
        exec.status = 'success';
        exec.finishedAt = new Date().toISOString();
        exec.log.push('Concluido com sucesso');
        if (io)
            io.emit('automation:done', { id: job.id, success: true });
    })();
    return res.json({ success: true, executionId: exec.id });
});
router.get('/:id/history', (req, res) => {
    const job = jobs.find(j => j.id === req.params.id);
    if (!job)
        return res.status(404).json({ error: 'Nao encontrado' });
    return res.json(job.executions);
});
router.delete('/:id', (req, res) => {
    jobs = jobs.filter(j => j.id !== req.params.id);
    return res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=automation.js.map