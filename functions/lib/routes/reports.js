"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// POST /api/reports/generate - Cria um novo registro de relatório
router.post('/generate', async (req, res) => {
    const { studyId, format } = req.body; // Espera-se 'PDF' ou 'XLSX'
    if (!studyId || !format) {
        return res.status(400).json({ message: 'studyId and format are required.' });
    }
    try {
        // Verifica se o estudo correspondente existe
        const study = await prisma_1.prisma.study.findUnique({ where: { id: studyId } });
        if (!study) {
            return res.status(404).json({ message: 'Study not found.' });
        }
        // Cria o novo relatório no banco de dados
        const newReport = await prisma_1.prisma.report.create({
            data: {
                studyId,
                format,
                status: 'Pending', // O status real seria atualizado por um processo de geração
            },
        });
        return res.status(202).json({
            message: 'Solicitação de geração de relatório recebida!',
            reportId: newReport.id,
            status: newReport.status,
        });
    }
    catch (error) {
        console.error('Failed to generate report request:', error);
        return res.status(500).json({ message: 'Failed to request report generation' });
    }
});
// GET /api/reports/:id - Recupera detalhes de um relatório específico
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const report = await prisma_1.prisma.report.findUnique({
            where: { id },
            include: {
                study: true, // Inclui o estudo pai para acessar o resultado da análise
            },
        });
        if (!report) {
            return res.status(404).json({ message: `Relatório com ID ${id} não encontrado.` });
        }
        // Monta a resposta combinando dados do relatório e o resultado do estudo
        // para manter a compatibilidade com o que o frontend esperava do mock.
        const response = {
            message: 'Detalhes do relatório recuperados com sucesso.',
            reportId: report.id,
            status: report.status,
            result: report.study.result, // Pega o JSON de resultado do estudo pai
            createdAt: report.createdAt,
            studyId: report.studyId,
        };
        return res.status(200).json(response);
    }
    catch (error) {
        console.error(`Failed to retrieve report ${id}:`, error);
        return res.status(500).json({ message: 'Failed to retrieve report' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map