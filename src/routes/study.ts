
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Rota para buscar todos os estudos
router.get('/', async (_req, res) => {
  try {
    const studies = await prisma.study.findMany({
      include: {
        client: true, // Inclui o cliente relacionado em cada estudo
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // O TypeScript infere o tipo de `studies` corretamente, incluindo o `client`.
    // O `map` abaixo adiciona a propriedade `clientName` para conveniência do frontend.
    const formattedStudies = studies.map((study) => ({
      ...study,
      clientName: study.client.name, // Acesso seguro, pois `client` está incluído
    }));

    return res.status(200).json(formattedStudies);
  } catch (error) {
    console.error('Falha ao buscar estudos:', error);
    return res.status(500).json({ message: 'Falha ao buscar estudos' });
  }
});

// Rota para buscar um estudo específico por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const study = await prisma.study.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!study) {
      return res.status(404).json({ message: 'Estudo não encontrado.' });
    }

    // Formata a resposta para incluir campos de conveniência
    const formattedStudy = {
      ...study,
      clientName: study.client.name,
      analysisResult: study.result, // `result` já faz parte do modelo `Study`
    };

    return res.status(200).json(formattedStudy);
  } catch (error) {
    console.error(`Falha ao buscar o estudo ${id}:`, error);
    return res.status(500).json({ message: 'Falha ao buscar o estudo.' });
  }
});

// Rota para atualizar o nome de um estudo
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'O novo nome é obrigatório.' });
  }

  try {
    const updatedStudy = await prisma.study.update({
      where: { id },
      data: { name },
    });
    return res.status(200).json(updatedStudy);
  } catch (error: any) {
    // Tratamento de erro específico para quando o registro não é encontrado
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Estudo não encontrado.' });
    }
    console.error(`Falha ao atualizar o estudo ${id}:`, error);
    return res.status(500).json({ message: 'Falha ao atualizar o estudo.' });
  }
});

// Rota para disparar uma nova análise (apenas atualiza o status)
router.post('/:id/reanalyze', async (req, res) => {
  const { id } = req.params;
  try {
    const study = await prisma.study.update({
      where: { id },
      data: { status: 'Em Andamento' },
    });
    // Retorna 202 Accepted para indicar que a solicitação foi aceita para processamento
    return res.status(202).json(study);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Estudo não encontrado.' });
    }
    console.error(`Falha ao iniciar a reanálise do estudo ${id}:`, error);
    return res.status(500).json({ message: 'Falha ao iniciar a reanálise do estudo.' });
  }
});

export default router;
