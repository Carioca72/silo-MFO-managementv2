"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const triggerEngine_js_1 = require("../services/ai/triggerEngine.js");
const router = express_1.default.Router();
let triggerLog = [];
// POST /api/triggers/analyze — analisa evento e dispara acao
router.post('/analyze', async (req, res) => {
    const event = req.body;
    if (!event.body || !event.source)
        return res.status(400).json({ error: 'body e source obrigatorios' });
    const decision = await (0, triggerEngine_js_1.analyzeTrigger)(event);
    triggerLog.unshift({ id: 'tl' + Date.now(), event, decision, ts: new Date().toISOString() });
    const io = global.io;
    (0, triggerEngine_js_1.executeTriggerAction)(decision, event, io).catch(console.error);
    return res.json({ decision, triggered: decision.confidence >= 0.6 });
});
// POST /api/triggers/email-webhook — IMAP listener chama esta rota
router.post('/email-webhook', async (req, res) => {
    const { from, subject, body, attachments = [] } = req.body;
    const event = { source: 'email', from, subject, body,
        attachments, receivedAt: new Date().toISOString() };
    const decision = await (0, triggerEngine_js_1.analyzeTrigger)(event);
    const io = global.io;
    (0, triggerEngine_js_1.executeTriggerAction)(decision, event, io).catch(console.error);
    return res.json({ received: true, action: decision.action, confidence: decision.confidence });
});
// POST /api/triggers/whatsapp-webhook — WPPConnect chama esta rota
router.post('/whatsapp-webhook', async (req, res) => {
    const { from, body } = req.body;
    const event = { source: 'whatsapp', from, body,
        receivedAt: new Date().toISOString() };
    const decision = await (0, triggerEngine_js_1.analyzeTrigger)(event);
    const io = global.io;
    (0, triggerEngine_js_1.executeTriggerAction)(decision, event, io).catch(console.error);
    return res.json({ received: true, action: decision.action });
});
router.get('/log', (_, res) => {
    return res.json(triggerLog.slice(0, 50));
});
router.get('/stats', (_, res) => {
    const byAction = {};
    triggerLog.forEach(l => { byAction[l.decision.action] = (byAction[l.decision.action] || 0) + 1; });
    return res.json({ total: triggerLog.length, byAction, lastFired: triggerLog[0]?.ts });
});
exports.default = router;
//# sourceMappingURL=triggers.js.map