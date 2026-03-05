"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTrigger = analyzeTrigger;
exports.executeTriggerAction = executeTriggerAction;
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const SYSTEM = `Voce e o SILO Trigger Engine.
Analise a mensagem e retorne APENAS JSON com TriggerDecision.
Intencoes: generate_report, extract_data, send_material, schedule_meeting, ignore, clarify.
Se confidence < 0.6 sempre retorne action: clarify.
Mapeamento: relatorio/extrato/posicao → generate_report + tools.
Dados/CNPJ/valores → extract_data. Pedido de envio → send_material.`;
async function analyzeTrigger(event) {
    const prompt = `SOURCE: ${event.source}\nFROM: ${event.from}
SUBJECT: ${event.subject || ''}\nBODY: ${event.body.substring(0, 500)}`;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest',
            config: { systemInstruction: SYSTEM },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        const txt = (res.text || '{}').replace(/```json|```/g, '').trim();
        return JSON.parse(txt);
    }
    catch {
        return { action: 'ignore', confidence: 0, intent: 'Erro de parse', priority: 'low' };
    }
}
async function executeTriggerAction(decision, event, io) {
    if (decision.confidence < 0.6)
        return;
    const base = `http://localhost:${process.env.PORT || 3000}`;
    if (io)
        io.emit('trigger:fired', {
            action: decision.action, intent: decision.intent,
            from: event.from, priority: decision.priority, ts: new Date().toISOString(),
        });
    if (decision.action === 'generate_report' && decision.clientId) {
        await fetch(`${base}/api/reports/generate`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: decision.clientId,
                tools: decision.tools || ['ExtratoCarteira022', 'Value_at_Risk001'],
                reportName: `Auto: ${decision.intent}`, tipo: decision.reportType || 'relatorio',
            }),
        });
    }
    if (decision.action === 'extract_data') {
        await fetch(`${base}/api/email/extract`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, decision }),
        });
    }
    if (decision.action === 'send_material' && decision.suggestedResponse) {
        await fetch(`${base}/api/wa/sessions/s1/send`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: event.from, message: decision.suggestedResponse }),
        });
    }
}
//# sourceMappingURL=triggerEngine.js.map