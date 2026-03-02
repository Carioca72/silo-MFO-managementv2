import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import studyRoutes from './src/routes/study'; // Importando as novas rotas

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

// Usando as rotas de estudo
app.use('/api/study', studyRoutes);

// Iniciar o servidor
app.listen(port, () => {
  console.log(`[server]: Servidor rodando em http://localhost:${port}`);
});
