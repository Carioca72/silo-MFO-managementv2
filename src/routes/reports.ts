
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { generateSiloPDF } from '../services/pdf/siloReportPDF.js';

const router = Router();

// Rota para gerar um novo relatório associado a um estudo
router.post('/generate', async (req, res) => {
  const { studyId, format = 'PDF' } = req.body;

  if (!studyId) {
    return res.status(400).json({ message: 'O ID do estudo (studyId) é obrigatório.' });
  }

  try {
    // 1. Verificar se o estudo pai existe
    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: { client: true }, // Inclui dados do cliente para o PDF
    });

    if (!study) {
      return res.status(404).json({ message: 'Estudo não encontrado.' });
    }

    // 2. Criar o registro do relatório no banco de dados
    const report = await prisma.report.create({
      data: {
        studyId: studyId,
        format: format,
        // storagePath será preenchido após a geração do arquivo
      },
    });

    // 3. Atualizar o status do estudo para 'Em Andamento'
    await prisma.study.update({
      where: { id: studyId },
      data: { status: 'Em Andamento' },
    });

    // 4. Disparar a geração do PDF em segundo plano
    (async () => {
      try {
        // Simulação de dados para o PDF a partir dos dados do estudo
        // TODO: Substituir por dados reais do estudo quando disponíveis em `study.result`
        const pdfData = {
          clientName: study.client.name,
          portfolio: `Carteira de ${study.client.name}`,
          period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          aum: 'R$ 10.0M', // Exemplo
          retorno12m: '10.5%', // Exemplo
          retornoMes: '1.2%', // Exemplo
          var95: '1.5%', // Exemplo
          sharpe: '1.8', // Exemplo
          narrative: 'A carteira teve um desempenho robusto este mês...', // Exemplo
          sections: [], // Adicionar seções se necessário
          reportType: study.type,
        };

        const pdfPath = await generateSiloPDF(pdfData);

        // 5. Sucesso: Atualizar o relatório com o caminho do arquivo e o estudo como 'Concluído'
        await prisma.report.update({
          where: { id: report.id },
          data: { storagePath: pdfPath },
        });
        await prisma.study.update({
          where: { id: studyId },
          data: { status: 'Concluído' },
        });

        console.log(`[Report] PDF gerado com sucesso para o estudo ${studyId} em ${pdfPath}`);

      } catch (error) {
        // 6. Erro: Atualizar o status do estudo para 'Erro'
        await prisma.study.update({
          where: { id: studyId },
          data: { status: 'Erro' },
        });
        console.error(`[Report] Falha ao gerar PDF para o estudo ${studyId}:`, error);
      }
    })();

    // 7. Retornar o relatório recém-criado (sem bloquear a resposta)
    return res.status(202).json(report);

  } catch (error) {
    console.error('Falha ao iniciar a geração do relatório:', error);
    return res.status(500).json({ message: 'Falha interna ao processar a solicitação do relatório.' });
  }
});

// Rota para buscar todos os relatórios (com paginação)
router.get('/', async (req, res) => {
  const { studyId, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const whereClause: any = {};
    if (studyId) {
      whereClause.studyId = studyId as string;
    }

    const [reports, total] = await prisma.$transaction([
      prisma.report.findMany({
        where: whereClause,
        skip: skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      data: reports,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Falha ao buscar relatórios:', error);
    return res.status(500).json({ message: 'Falha ao buscar relatórios.' });
  }
});

// Rota para buscar um relatório específico por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: { study: true }, // Incluir o estudo pai
    });

    if (!report) {
      return res.status(404).json({ message: 'Relatório não encontrado.' });
    }
    return res.status(200).json(report);
  } catch (error) {
    console.error(`Falha ao buscar o relatório ${id}:`, error);
    return res.status(500).json({ message: 'Falha ao buscar o relatório.' });
  }
});

// Rota para fazer o download do PDF de um relatório
router.get('/:id/pdf', async (req, res) => {
    const { id } = req.params;
    try {
        const report = await prisma.report.findUnique({ where: { id } });

        if (!report || !report.storagePath) {
            return res.status(404).json({ message: 'PDF não encontrado ou ainda não foi gerado.' });
        }

        // A função res.download lida com a definição dos headers corretos
        res.download(report.storagePath);

    } catch (error) {
        console.error(`Falha ao fazer o download do PDF para o relatório ${id}:`, error);
        return res.status(500).json({ message: 'Não foi possível fazer o download do arquivo.' });
    }
});

export default router;
