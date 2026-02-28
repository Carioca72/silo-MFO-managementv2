import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { stringify } from 'csv-stringify/sync';

// Tipagem para os dados do estudo (simplificada)
interface StudyData {
    clientName: string;
    comparison: {
        current: { [key: string]: any };
        new: { [key: string]: any };
        delta: { [key: string]: any };
    };
    projection: any[]; // Dados da projeção mensal
}

class ReportGenerator {

    private templatePath: string;

    constructor() {
        this.templatePath = path.resolve(__dirname, '../templates/report.html');
    }

    private getTemplateContent(): string {
        return fs.readFileSync(this.templatePath, 'utf-8');
    }

    private populateTemplate(data: StudyData): string {
        let content = this.getTemplateContent();
        
        // Popula dados do cliente
        content = content.replace(/{{clientName}}/g, data.clientName);

        // Popula tabela de comparação
        const comparison = data.comparison;
        content = content
            .replace('{{current_total_return}}', comparison.current.totalReturn.toFixed(2))
            .replace('{{new_total_return}}', comparison.new.totalReturn.toFixed(2))
            .replace('{{delta_total_return}}', comparison.delta.totalReturn.toFixed(2))
            .replace('{{delta_return_class}}', comparison.delta.totalReturn >= 0 ? 'highlight-positive' : 'highlight-negative')
            
            .replace('{{current_volatility}}', (comparison.current.volatility * 100).toFixed(2))
            .replace('{{new_volatility}}', (comparison.new.volatility * 100).toFixed(2))
            .replace('{{delta_volatility}}', (comparison.delta.volatility * 100).toFixed(2))
            .replace('{{delta_volatility_class}}', comparison.delta.volatility <= 0 ? 'highlight-positive' : 'highlight-negative') // Menor volatilidade é bom

            .replace('{{current_sharpe}}', comparison.current.sharpe.toFixed(2))
            .replace('{{new_sharpe}}', comparison.new.sharpe.toFixed(2))
            .replace('{{delta_sharpe}}', comparison.delta.sharpe.toFixed(2))
            .replace('{{delta_sharpe_class}}', comparison.delta.sharpe >= 0 ? 'highlight-positive' : 'highlight-negative')

            .replace('{{current_final_balance}}', comparison.current.finalBalance.toFixed(2))
            .replace('{{new_final_balance}}', comparison.new.finalBalance.toFixed(2))
            .replace('{{delta_final_balance}}', comparison.delta.finalBalance.toFixed(2))
            .replace('{{delta_balance_class}}', comparison.delta.finalBalance >= 0 ? 'highlight-positive' : 'highlight-negative');
            
        return content;
    }

    public async generatePdf(data: StudyData): Promise<Buffer> {
        const htmlContent = this.populateTemplate(data);
        
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        
        await browser.close();
        
        return pdfBuffer;
    }

    public generateCsv(data: StudyData): string {
        // Aba 1: Projeção 12 meses
        const projectionData = data.projection.map(p => ({ Mês: p.month, ...p }));

        // Aba 2: Comparativo
        const comparisonData = [
            ['Indicador', 'Carteira Atual', 'Novo Cenário', 'Δ R$', 'Δ %'],
            ['Retorno Líquido', data.comparison.current.totalReturn, data.comparison.new.totalReturn, data.comparison.delta.totalReturn, data.comparison.delta.totalReturnPct],
            ['Volatilidade', data.comparison.current.volatility, data.comparison.new.volatility, data.comparison.delta.volatility, data.comparison.delta.volatilityPct],
            ['Sharpe', data.comparison.current.sharpe, data.comparison.new.sharpe, data.comparison.delta.sharpe, data.comparison.delta.sharpePct],
        ];
        
        // Como o formato CSV padrão não suporta abas, vamos retornar uma string com os dois CSVs concatenados
        // ou, para uma melhor UX, poderíamos criar um zip com dois arquivos, mas isso adiciona complexidade.
        // Por simplicidade, vamos gerar apenas o comparativo por enquanto.
        
        const csvOutput = stringify(comparisonData);

        return csvOutput;
    }
}

export const reportGenerator = new ReportGenerator();
