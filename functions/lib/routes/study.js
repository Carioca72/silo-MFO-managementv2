"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Rota para buscar todos os estudos
router.get('/', async (_req, res) => {
    try {
        const studies = await prisma_1.prisma.study.findMany({
            include: {
                client: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // Garante a tipagem correta no map
        const formattedStudies = studies.map((study) => ({
            ...study,
            clientName: study.client.name,
        }));
        return res.status(200).json(formattedStudies);
    }
    catch (error) {
        console.error('Failed to retrieve studies:', error);
        return res.status(500).json({ message: 'Failed to retrieve studies' });
    }
});
// Rota para buscar um estudo específico por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const study = await prisma_1.prisma.study.findUnique({
            where: { id },
            include: {
                client: true,
            },
        });
        if (!study) {
            return res.status(404).json({ message: 'Study not found.' });
        }
        const formattedStudy = {
            ...study,
            clientName: study.client.name,
            analysisResult: study.result,
        };
        return res.status(200).json(formattedStudy);
    }
    catch (error) {
        console.error(`Failed to retrieve study ${id}:`, error);
        return res.status(500).json({ message: 'Failed to retrieve study' });
    }
});
// Rota para atualizar o nome de um estudo
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'New name is required.' });
    }
    try {
        const updatedStudy = await prisma_1.prisma.study.update({
            where: { id },
            data: { name },
        });
        return res.status(200).json(updatedStudy);
    }
    catch (error) {
        // Verifica o código de erro do Prisma de forma segura
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ message: 'Study not found.' });
        }
        console.error(`Failed to update study ${id}:`, error);
        return res.status(500).json({ message: 'Failed to update study' });
    }
});
// Rota para disparar uma nova análise (apenas atualiza o status)
router.post('/:id/reanalyze', async (req, res) => {
    const { id } = req.params;
    try {
        const study = await prisma_1.prisma.study.update({
            where: { id },
            data: { status: 'Em Andamento' },
        });
        return res.status(202).json(study);
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ message: 'Study not found.' });
        }
        console.error(`Failed to reanalyze study ${id}:`, error);
        return res.status(500).json({ message: 'Failed to reanalyze study' });
    }
});
exports.default = router;
//# sourceMappingURL=study.js.map