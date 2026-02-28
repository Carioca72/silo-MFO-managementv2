import express from 'express';
import { COMDINHEIRO_ENDPOINTS } from '../services/comdinheiro/endpoints.js';
import { generateSiloPDF } from '../services/pdf/siloReportPDF.js';

const router = express.Router();

let reports: any[] = [
 {id:'r1',nome:'Relatório Mensal — Família Andrade',tipo:'relatorio',
 clientId:'1',clientNome:'Família Andrade',
 tools:['ExtratoCarteira022','Value_at_Risk001'],
 status:'enviado',createdAt:'2026-02-28T09:00:00Z',
 sends:[{channel:'email',status:'sent'},{channel:'whatsapp',status:'sent'}]},
 {id:'r2',nome:'Estudo — Dr. Vasconcelos',tipo:'estudo',
 clientId:'p1',clientNome:'Dr. Eduardo Vasconcelos',
 tools:['Markowitz001','Value_at_Risk001'],
 status:'gerado',createdAt:'2026-02-25T11:00:00Z',sends:[]},
];

router.get('/', (req,res) => {
 const {clientId,tipo,status,page=1,limit=20} = req.query;
 let f = [...reports];
 if (clientId) f=f.filter(r=>r.clientId===clientId);
 if (tipo) f=f.filter(r=>r.tipo===tipo);
 if (status) f=f.filter(r=>r.status===status);
 const off = (Number(page)-1)*Number(limit);
 res.json({data:f.slice(off,off+Number(limit)),total:f.length,page:Number(page)});
});

router.get('/:id', (req,res) => {
 const r = reports.find(r=>r.id===req.params.id);
 if (!r) return res.status(404).json({error:'Não encontrado'});
 res.json(r);
});

router.post('/generate', async (req,res) => {
 const {clientId,tools,reportName,tipo='relatorio'} = req.body;
 if (!clientId||!tools?.length)
 return res.status(400).json({error:'clientId e tools obrigatórios'});
 
 const r: any = {
 id:'r'+Date.now(),
 nome:reportName||`Relatorio ${new Date().toLocaleDateString('pt-BR')}`,
 tipo, clientId, tools, status:'gerando',
 createdAt:new Date().toISOString(),
 narrative:'Gerando com SILO Advisor IA...', sends:[], pdfPath:null,
 };
 reports.unshift(r);
 
 // Gera PDF em background sem bloquear resposta
 (async () => {
 try {
 const pdfPath = await generateSiloPDF({
 clientName: 'Cliente ' + clientId,
 portfolio: 'portfolio_' + clientId,
 period: new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'}),
 aum:'R$ 12,4M', retorno12m:'8.2%', retornoMes:'1.4%',
 var95:'1.1%', sharpe:'1.42',
 narrative: 'A carteira apresentou performance acima do CDI. ' +
 'Retorno de +8.2% nos ultimos 12 meses. VaR de 1.1% dentro dos limites.',
 sections: tools.map((t:string) => ({title:t, type:'chart_placeholder', content:''})),
 reportType: tipo,
 });
 r.status = 'gerado'; r.pdfPath = pdfPath;
 r.narrative = 'Relatorio gerado com sucesso.';
 
 const io = (global as any).io;
 if (io) io.emit('report:generated', {reportId:r.id, pdfPath, clientId});
 } catch(err) {
 r.status = 'error';
 console.error('[Report] Erro ao gerar PDF:', err);
 }
 })();
 
 res.status(201).json(r);
});

// GET /api/reports/:id/pdf
router.get('/:id/pdf', (req,res) => {
 const r = reports.find(r=>r.id===req.params.id);
 if (!r?.pdfPath) return res.status(404).json({error:'PDF nao gerado ainda'});
 res.download(r.pdfPath);
});

router.post('/:id/send', (req,res) => {
 const {channels,clientId} = req.body;
 const r = reports.find(r=>r.id===req.params.id);
 if (!r) return res.status(404).json({error:'Não encontrado'});
 
 const sends = channels.map((ch:string)=>
 ({channel:ch,status:'queued',ts:new Date().toISOString()}));
 
 r.sends.push(...sends); r.status='enviado';
 
 const io = (global as any).io;
 if (io) io.emit('report:sent',{reportId:r.id,channels,clientId});
 
 res.json({success:true,sends});
});

router.delete('/:id', (req,res) => {
 reports=reports.filter(r=>r.id!==req.params.id);
 res.json({success:true});
});

export default router;
