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

    // ✅ Adicionar estas linhas para UTF-8
    workbook.properties.created = new Date();
    workbook.properties.modified = new Date();
    workbook.properties.title = 'Estudo de Carteira Silo MFO';

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
      { header: 'Liquidez (Dias)', key: 'liquidez', width: 15 }, // ✅ NOVO
      { header: 'Estratégia', key: 'estrategia', width: 15 }, // ✅ NOVO
      { header: 'Tributação (IR)', key: 'tributacao', width: 12 }, // ✅ NOVO
      { header: 'Taxa Adm A.A %', key: 'taxaAdm', width: 12 }, // ✅ NOVO
      { header: 'Valor', key: 'valor', width: 15 },
      { header: '%', key: 'pct', width: 10 },
      { header: 'Custo Anual/Mês', key: 'custoMensal', width: 15 }, // ✅ NOVO
      { header: 'Retorno 12m', key: 'ret12m', width: 12 },
    ];

    assets.forEach(asset => {
      // ✅ Validar que os valores são strings UTF-8
      const row = {
        instituicao: String(asset.instituicao || '').trim(),
        classe: String(asset.classe || '').trim(),
        titulo: String(asset.titulo || '').trim(),
        liquidez: asset.liquidez || 0,
        estrategia: String(asset.estrategia || '').trim(),
        tributacao: asset.tributacao || 0,
        taxaAdm: asset.taxaAdm || 0,
        valor: Number(asset.valor || 0),
        pct: Number(asset.pct || 0),
        custoMensal: Number(asset.custoMensal || 0),
        ret12m: Number(asset.ret12m || 0),
      };
      sheet.addRow(row);
    });
    
    // ✅ Formatar header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
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
