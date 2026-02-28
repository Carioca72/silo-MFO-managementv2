import express from 'express';
import { createServer } from 'http';
import { Server as IO } from 'socket.io';
import { createServer as createVite } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import reportsRouter from './src/routes/reports.js';
import clientsRouter from './src/routes/clients.js';
import emailRouter from './src/routes/email.js';
import waRouter from './src/routes/whatsapp.js';
import autoRouter from './src/routes/automation.js';
import cmdRouter from './src/routes/comdinheiro.js';
import triggersRouter from './src/routes/triggers.js';
import boletosRouter from './src/routes/boletos.js';
import swiftRouter from './src/routes/swift.js';
import crmWebhookRouter from './src/routes/crm-webhook.js';

import studyRouter from './src/routes/study.js';

import portfolioRouter from './src/routes/portfolio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function start() {
 const app = express();
 const http = createServer(app);
 const io = new IO(http, { cors: { origin:'*' } });
 (global as any).io = io;

 io.on('connection', sock => {
 console.log('WS connected:', sock.id);
 sock.on('disconnect', () => console.log('WS disconnected:', sock.id));
 });

 app.use(express.json({ limit:'10mb' }));
 app.use((req,_,next) => {
 console.log(new Date().toISOString(), req.method, req.path); next();
 });

 app.get('/api/health', (_,res) =>
 res.json({ status:'ok', ws: io.engine.clientsCount }));

 app.post('/api/advisor/chat', async (req, res) => {
 try {
 const { message, context, history } = req.body;
 if (!message?.trim())
 return res.status(400).json({ error:'message e obrigatorio' });
 const { siloAdvisor } = await import('./src/services/ai/siloAdvisor.ts');
 const response = await siloAdvisor.generateResponse(message, context, history);
 res.json({ response });
 } catch (e: any) {
 console.error('Advisor error:', e);
 res.status(500).json({ error: e.message || 'Erro interno' });
 }
 });

 app.use('/api/reports', reportsRouter);
 app.use('/api/clients', clientsRouter);
 app.use('/api/email', emailRouter);
 app.use('/api/wa', waRouter);
 app.use('/api/automation', autoRouter);
 app.use('/api/cmd', cmdRouter);
 app.use('/api/triggers', triggersRouter);
 app.use('/api/boletos', boletosRouter);
 app.use('/api/swift', swiftRouter);
 app.use('/api/crm/webhook', crmWebhookRouter);
 app.use('/api/study', studyRouter);
 app.use('/api/portfolio', portfolioRouter);

 app.get('/api/tools', async (_,res) => {
 const { COMDINHEIRO_ENDPOINTS } = await
 import('./src/services/comdinheiro/endpoints.ts');
 res.json(COMDINHEIRO_ENDPOINTS);
 });

 app.use((err:any,_req:any,res:any,_next:any) => {
 console.error('Error:', err);
 res.status(500).json({ error: err.message||'Internal Server Error' });
 });

 if (process.env.NODE_ENV !== 'production') {
 const vite = await createVite({
 server:{ middlewareMode:true }, appType:'spa'
 });
 app.use(vite.middlewares);
 } else {
 app.use(express.static(join(__dirname,'dist')));
 app.get('*',(_,res)=>res.sendFile(join(__dirname,'dist','index.html')));
 }

 const PORT = parseInt(process.env.PORT||'3000');
 http.listen(PORT,'0.0.0.0',()=>
 console.log(`■ SILO MFO on http://localhost:${PORT}`));
}

start();

