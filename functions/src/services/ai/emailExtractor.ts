import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface EmailData {
 category: 'report_request'|'data_update'|'meeting_request'|'complaint'|'informative'|'other';
 priority: 'high'|'medium'|'low';
 sentiment: 'positive'|'neutral'|'negative'|'urgent';
 extractedData: {
 cnpj?: string;
 portfolio?: string;
 requestedPeriod?: {start:string; end:string};
 requestedReports?: string[];
 financialValues?: number[];
 clientName?: string;
 deadlineDate?: string;
 };
 suggestedAction: string;
 autoReplyDraft?: string;
 endpointsNeeded?: string[];
}

const SYSTEM = `Voce e o SILO Email Intelligence.
Analise o email e retorne APENAS JSON com EmailData.
Extracao de dados:
- CNPJ: formato XX.XXX.XXX/XXXX-XX
- portfolio: palavras como carteira, portfolio, fundo + nome
- requestedReports: extrato→ExtratoCarteira022, risco→Value_at_Risk001,
 otimizacao→Markowitz001, posicao→PosicaoConsolidada001
- financialValues: R$ seguido de valor numerico
- deadlineDate: expressoes como 'ate sexta', 'urgente', datas`;

export async function extractEmailData(
 from:string, subject:string, body:string, attachments:string[]=[]
): Promise<EmailData> {
 const prompt = `DE: ${from}\nASSUNTO: ${subject}\nCORPO: ${body.substring(0,800)}\nANEXOS: ${attachments.join(',')||'nenhum'}`;
 
 try {
 const res = await ai.models.generateContent({
 model:'gemini-2.5-flash-latest',
 config:{systemInstruction:SYSTEM},
 contents:[{role:'user',parts:[{text:prompt}]}],
 });
 const txt = (res.text||'{}').replace(/```json|```/g,'').trim();
 return JSON.parse(txt) as EmailData;
 } catch {
 return {category:'other',priority:'low',sentiment:'neutral',
 extractedData:{},suggestedAction:'Revisar manualmente'};
 }
}

export async function processInbox(
 emails: Array<{id:string;from:string;subject:string;body:string}>
): Promise<Array<{emailId:string; data:EmailData}>> {
 const results = await Promise.allSettled(
 emails.map(async e => ({
 emailId: e.id,
 data: await extractEmailData(e.from, e.subject, e.body),
 }))
 );
 return results
 .filter(r => r.status==='fulfilled')
 .map(r => (r as PromiseFulfilledResult<any>).value);
}
