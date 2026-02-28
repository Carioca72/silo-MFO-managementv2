import ExcelJS from 'exceljs';
import { Asset } from '../math/markowitz.js';

interface StudyData {
  clientName: string;
  currentPortfolio: any[];
  newPortfolio: any[];
  comparative: any;
}

export class ExcelGenerator {
  async generateStudyExcel(data: StudyData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // 1. Cenário Atual
    const sheetCurrent = workbook.addWorksheet('CENÁRIO ATUAL');
    this.setupSheet(sheetCurrent, data.currentPortfolio);

    // 2. Novo Cenário
    const sheetNew = workbook.addWorksheet('NOVO CENÁRIO');
    this.setupSheet(sheetNew, data.newPortfolio);

    // 3. Comparativo
    const sheetComp = workbook.addWorksheet('COMPARATIVO');
    this.setupComparative(sheetComp, data.comparative);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }

  private setupSheet(sheet: ExcelJS.Worksheet, assets: any[]) {
    sheet.columns = [
      { header: 'Instituição', key: 'instituicao', width: 20 },
      { header: 'Classe', key: 'classe', width: 15 },
      { header: 'Título', key: 'titulo', width: 30 },
      { header: 'Valor', key: 'valor', width: 15 },
      { header: '%', key: 'pct', width: 10 },
      { header: 'Retorno 12m', key: 'ret12m', width: 12 },
    ];

    assets.forEach(asset => {
      sheet.addRow(asset);
    });
    
    // Styling
    sheet.getRow(1).font = { bold: true };
  }

  private setupComparative(sheet: ExcelJS.Worksheet, data: any) {
    sheet.columns = [
      { header: 'Indicador', key: 'metric', width: 25 },
      { header: 'Atual', key: 'current', width: 15 },
      { header: 'Sugerido', key: 'suggested', width: 15 },
      { header: 'Variação', key: 'diff', width: 15 },
    ];
    
    // Add rows from data object
    Object.keys(data).forEach(key => {
        sheet.addRow({
            metric: key,
            current: data[key].current,
            suggested: data[key].suggested,
            diff: data[key].diff
        });
    });
  }
}

export const excelGenerator = new ExcelGenerator();
