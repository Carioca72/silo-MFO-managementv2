import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io'; // Importa Socket

// Import all routes
import studyRoutes from '../src/routes/study';
import advisorRoutes from '../src/routes/advisor';
import automationRoutes from '../src/routes/automation';
import boletosRoutes from '../src/routes/boletos';
import clientsRoutes from '../src/routes/clients';
import comdinheiroRoutes from '../src/routes/comdinheiro';
import crmWebhookRoutes from '../src/routes/crm-webhook';
import emailRoutes from '../src/routes/email';
import portfolioRoutes from '../src/routes/portfolio';
import reportsRoutes from '../src/routes/reports';
import swiftRoutes from '../src/routes/swift';
import triggersRoutes from '../src/routes/triggers';
import whatsappRoutes from '../src/routes/whatsapp';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP and Socket.IO Server Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  },
});
(global as any).io = io; 

// Tipagem do Socket (Correção do erro de 'any')
io.on('connection', (socket: Socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


// Rota de Teste
app.get('/', (_req: Request, res: Response) => { // Correção do erro de 'req' não utilizado
  res.send('Servidor FinAssist API está no ar!');
});

// Register all routes
app.use('/api/study', studyRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/boletos', boletosRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/cmd', comdinheiroRoutes);
app.use('/api/crm', crmWebhookRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/swift', swiftRoutes);
app.use('/api/triggers', triggersRoutes);
app.use('/api/wa', whatsappRoutes);


// Iniciar o servidor
httpServer.listen(port, () => {
  console.log(`[server]: Servidor rodando em http://localhost:${port}`);
});
