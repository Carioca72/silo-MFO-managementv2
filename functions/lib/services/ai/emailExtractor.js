"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEmailData = extractEmailData;
exports.processInbox = processInbox;
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const SYSTEM = `Voce e o SILO Email Intelligence.
Analise o email e retorne APENAS JSON com EmailData.
Extracao de dados:
- CNPJ: formato XX.XXX.XXX/XXXX-XX
- portfolio: palavras como carteira, portfolio, fundo + nome
- requestedReports: extrato→ExtratoCarteira022, risco→Value_at_Risk001,
 otimizacao→Markowitz001, posicao→PosicaoConsolidada001
- financialValues: R$ seguido de valor numerico
- deadlineDate: expressoes como 'ate sexta', 'urgente', datas`;
async function extractEmailData(from, subject, body, attachments = []) {
    const prompt = `DE: ${from}\nASSUNTO: ${subject}\nCORPO: ${body.substring(0, 800)}\nANEXOS: ${attachments.join(',') || 'nenhum'}`;
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
        return { category: 'other', priority: 'low', sentiment: 'neutral',
            extractedData: {}, suggestedAction: 'Revisar manualmente' };
    }
}
async function processInbox(emails) {
    const results = await Promise.allSettled(emails.map(async (e) => ({
        emailId: e.id,
        data: await extractEmailData(e.from, e.subject, e.body),
    })));
    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
}
//# sourceMappingURL=emailExtractor.js.map