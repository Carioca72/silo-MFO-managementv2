
import * as functions from 'firebase-functions';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

// Import all routes
// import studyRoutes from './routes/study';
import advisorRoutes from './routes/advisor';
import automationRoutes from './routes/automation';
import boletosRoutes from './routes/boletos';
import clientsRoutes from './routes/clients';
import comdinheiroRoutes from './routes/comdinheiro';
import crmWebhookRoutes from './routes/crm-webhook';
import emailRoutes from './routes/email';
// import portfolioRoutes from './routes/portfolio';
// import reportsRoutes from './routes/reports';
// import swiftRoutes from './routes/swift';
import triggersRoutes from './routes/triggers';
// import whatsappRoutes from './routes/whatsapp';

dotenv.config();

const app: Express = express();

// Middlewares
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Teste
app.get('/', (_req, res) => {
  res.send('Servidor FinAssist API está no ar!');
});

// Register all routes
// app.use('/api/study', studyRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/boletos', boletosRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/cmd', comdinheiroRoutes);
app.use('/api/crm', crmWebhookRoutes);
app.use('/api/email', emailRoutes);
// app.use('/api/portfolio', portfolioRoutes);
// app.use('/api/reports', reportsRoutes);
// app.use('/api/swift', swiftRoutes);
app.use('/api/triggers', triggersRoutes);
// app.use('/api/wa', whatsappRoutes);

// Expose the Express API as a single Cloud Function
export const api = functions.https.onRequest(app);

// NOTE: Socket.IO does not work out-of-the-box on Firebase Cloud Functions' HTTP triggers.
// A different approach is needed for real-time communication, like using the Firebase Realtime Database,
// Firestore listeners, or a dedicated WebSocket service. The code below will not work as expected.

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  },
});
(global as any).io = io; 

io.on('connection', (socket: Socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
