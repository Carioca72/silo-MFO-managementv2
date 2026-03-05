"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emailExtractor_js_1 = require("../services/ai/emailExtractor.js");
const router = express_1.default.Router();
// POST /api/email/analyze-inbox — IA categoriza todos emails do inbox
router.post('/analyze-inbox', async (_, res) => {
    // Em producao: busca via imap-simple dos sessions IMAP configurados
    const mockEmails = [
        { id: 'm1', from: 'gestao@andrade.com.br',
            subject: 'Relatorio mensal urgente',
            body: 'Preciso do extrato e VaR da carteira andrade_main referente a janeiro 2026. CNPJ: 12.345.678/0001-90. Ate sexta.' },
        { id: 'm2', from: 'financeiro@brennand.org',
            subject: 'Reuniao de revisao',
            body: 'Gostaria de agendar call para revisar alocacao do fundo brennand_fundo. Podem mandar posicao consolidada?' },
        { id: 'm3', from: 'diretoria@cerqueira.com',
            subject: 'URGENTE: VaR acima do limite',
            body: 'Nosso risco esta muito alto. Precisamos urgente do stress test e VaR 99%.' },
    ];
    const results = await (0, emailExtractor_js_1.processInbox)(mockEmails);
    return res.json({ results, total: results.length, processedAt: new Date() });
});
// POST /api/email/extract — extrai dados de email especifico
router.post('/extract', async (req, res) => {
    const { event } = req.body;
    const data = await (0, emailExtractor_js_1.extractEmailData)(event.from, event.subject || '', event.body, event.attachments || []);
    const io = global.io;
    if (io)
        io.emit('email:extracted', { from: event.from, data });
    return res.json({ data, extractedAt: new Date() });
});
let emailSessions = [
    { id: 'es1', nome: 'Silo MFO Principal', smtpHost: 'smtp.gmail.com',
        smtpPort: 587, smtpUser: 'reports@silo.com.br',
        imapHost: 'imap.gmail.com', imapPort: 993, active: true,
        createdAt: new Date().toISOString() }
];
router.get('/sessions', (_, res) => {
    return res.json(emailSessions);
});
router.post('/sessions', (req, res) => {
    const { nome, smtpHost, smtpPort, smtpUser, imapHost, imapPort } = req.body;
    const sess = { id: 'es' + Date.now(), nome, smtpHost,
        smtpPort: parseInt(smtpPort) || 587, smtpUser,
        smtpPassEnc: '[ENCRYPTED]', // Produção: AES-256-GCM
        imapHost, imapPort: parseInt(imapPort) || 993, active: false,
        createdAt: new Date().toISOString() };
    emailSessions.push(sess);
    return res.status(201).json(sess);
});
router.get('/sessions/:id/inbox', (_, res) => {
    return res.json([
        { id: 'm1', from: 'cliente@andrade.com.br',
            subject: 'Dúvida sobre rentabilidade',
            preview: 'Olá, gostaria de entender...',
            date: new Date().toISOString(), read: false },
        { id: 'm2', from: 'contato@brennand.org',
            subject: 'Reunião de revisão',
            preview: 'Podemos marcar para....',
            date: new Date(Date.now() - 86400000).toISOString(), read: true },
    ]);
});
router.post('/send', (req, res) => {
    const { sessionId, to, subject } = req.body;
    const sess = emailSessions.find(s => s.id === sessionId);
    if (!sess)
        return res.status(404).json({ error: 'Sessão não encontrada' });
    // Produção: nodemailer.createTransport({...sess}).sendMail(...)
    console.log(`EMAIL [${sess.nome}] -> ${to}: ${subject}`);
    return res.json({ success: true, messageId: 'email' + Date.now(), ts: new Date() });
});
router.get('/templates', (_, res) => {
    return res.json([
        { id: 't1', nome: 'Relatório Mensal',
            subject: '[Silo MFO] Relatório Mensal — {{mes}}' },
        { id: 't2', nome: 'Estudo de Carteira',
            subject: '[Silo MFO] Estudo de Viabilidade' },
        { id: 't3', nome: 'Alerta VaR',
            subject: '[ALERTA Silo] VaR excedido — {{cliente}}' },
    ]);
});
router.get('/log', (_, res) => {
    return res.json([
        { to: 'gestao@andrade.com.br', subject: 'Relatório Mensal',
            status: 'sent', ts: '28/02/2026 09:15' },
    ]);
});
exports.default = router;
//# sourceMappingURL=email.js.map