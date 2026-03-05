import * as functions from 'firebase-functions';
import express, { Express } from 'express';
import cors from 'cors';

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

const app: Express = express();

// Middlewares
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register all API routes
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

// 404 handler for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Export as Firebase Cloud Function
export const api = functions.https.onRequest(app);
