import { Router, Request, Response } from 'express';
import { reportGenerator } from '../services/reportGenerator';
import { prisma } from '../prisma/client'; // Supondo que o prisma client está configurado

const router = Router();

// Mock de dados, pois não temos a busca do estudo implementada
const getMockStudyData = (studyId: string) => ({
    clientName: "Cliente Exemplo",
    comparison: {
        current: { totalReturn: 5000, volatility: 0.15, sharpe: 0.5, finalBalance: 105000 },
        new: { totalReturn: 8000, volatility: 0.12, sharpe: 0.9, finalBalance: 108000 },
        delta: { 
            totalReturn: 3000, 
            volatility: -0.03, 
            sharpe: 0.4, 
            finalBalance: 3000,
            totalReturnPct: 60,
            volatilityPct: -20,
            sharpePct: 80
        },
    },
    projection: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, balance: 100000 + i * 500 }))
});

/**
 * @route   GET /api/study/:id/export/pdf
 * @desc    Gera e retorna um relatório de estudo de carteira em PDF.
 * @access  Public
 */
router.get('/:id/export/pdf', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // TODO: Substituir o mock pela busca real dos dados do estudo no banco de dados
        // const studyData = await prisma.study.findUnique({ where: { id } });
        const studyData = getMockStudyData(id);

        if (!studyData) {
            return res.status(404).json({ error: 'Estudo não encontrado.' });
        }

        const pdfBuffer = await reportGenerator.generatePdf(studyData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=estudo_carteira_${id}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).send('Erro interno ao gerar o relatório em PDF.');
    }
});

/**
 * @route   GET /api/study/:id/export/csv
 * @desc    Gera e retorna um relatório de estudo de carteira em CSV.
 * @access  Public
 */
router.get('/:id/export/csv', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // TODO: Substituir o mock pela busca real dos dados do estudo no banco de dados
        const studyData = getMockStudyData(id);

        if (!studyData) {
            return res.status(404).json({ error: 'Estudo não encontrado.' });
        }

        const csvData = reportGenerator.generateCsv(studyData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=estudo_carteira_${id}.csv`);
        res.send(csvData);

    } catch (error) {
        console.error("Erro ao gerar CSV:", error);
        res.status(500).send('Erro interno ao gerar o relatório em CSV.');
    }
});

export default router;
