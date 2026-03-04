import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import studyRoutes from '../src/routes/study'; // Caminho corrigido
import advisorRoutes from '../src/routes/advisor'; // Importa a nova rota

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Teste
app.get('/', (req: Request, res: Response) => {
  res.send('Servidor FinAssist API está no ar!');
});

// Usando as rotas
app.use('/api/study', studyRoutes);
app.use('/api/advisor', advisorRoutes); // Usa a nova rota

// Iniciar o servidor
app.listen(port, () => {
  console.log(`[server]: Servidor rodando em http://localhost:${port}`);
});
