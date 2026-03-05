
import * as functions from 'firebase-functions';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path'; // Importado para lidar com caminhos de arquivo

// Import all routes
import studyRoutes from './routes/study';
import advisorRoutes from './routes/advisor';
import automationRoutes from './routes/automation';
import boletosRoutes from './routes/boletos';
import clientsRoutes from './routes/clients';
import comdinheiroRoutes from './routes/comdinheiro';
import crmWebhookRoutes from './routes/crm-webhook';
import emailRoutes from './routes/email';
import reportsRoutes from './routes/reports';
import toolsRoutes from './routes/tools';
import triggersRoutes from './routes/triggers';

dotenv.config();

const app: Express = express();

// Middlewares
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do build do frontend
// Isso garante que o servidor possa encontrar os JS, CSS, e outros assets.
app.use(express.static(path.join(__dirname, '..", 'public')));

// Rota de Teste da API
app.get('/api/test', (_req, res) => {
  res.send('Servidor FinAssist API está no ar!');
});

// Register all API routes under /api
app.use('/api/studies', studyRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/boletos', boletosRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/cmd', comdinheiroRoutes);
app.use('/api/crm', crmWebhookRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/triggers', triggersRoutes);

// Rota "Catch-All" para lidar com o roteamento do lado do cliente (SPA)
// DEVE ser a última rota registrada.
app.get('*_*, (_req, res) => {
    // Envia o index.html principal para qualquer rota não-API.
    // O React Router no cliente irá então carregar a página correta.
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


// Expose the Express API as a single Cloud Function
export const api = functions.https.onRequest(app);
