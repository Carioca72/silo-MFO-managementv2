import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export interface SiloPDFData {
 clientName: string; portfolio: string; period: string;
 aum?: string; retorno12m?: string; retornoMes?: string;
 var95?: string; sharpe?: string; narrative: string;
 reportType: 'relatorio'|'estudo'|'alerta';
 sections: Array<{title:string; content:string; type:'text'|'chart_placeholder'}>;
}

function buildHTML(d: SiloPDFData): string {
 const kpis = [
 {label:'Retorno Mes', value:d.retornoMes||'—'},
 {label:'Retorno 12m', value:d.retorno12m||'—'},
 {label:'VaR (95%)', value:d.var95||'—'},
 {label:'Sharpe', value:d.sharpe||'—'},
 ];
 return `<!DOCTYPE html><html><head><meta charset='UTF-8'>
 <style>
 *{margin:0;padding:0;box-sizing:border-box}
 body{font-family:Arial,sans-serif;background:#FAF8F3}
 .header{background:#0F0F1A;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-end}
 .label{color:#C9A84C;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px}
 .client{color:white;font-size:22px;font-weight:700}
 .meta{color:rgba(255,255,255,0.4);font-size:11px;margin-top:4px}
 .aum{color:#C9A84C;font-size:26px;font-weight:700;text-align:right}
 .retorno{color:#4ADE80;font-size:14px;font-weight:600;margin-top:4px;text-align:right}
 .gold-bar{height:4px;background:linear-gradient(90deg,#C9A84C,#E8C97A)}
 .kpis{display:grid;grid-template-columns:repeat(4,1fr);background:white;border-bottom:1px solid #E2E8F0}
 .kpi{padding:16px;text-align:center;border-right:1px solid #E2E8F0}
 .kpi-label{font-size:9px;color:#94A3B8;font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
 .kpi-value{font-size:18px;font-weight:700;color:#0F0F1A}
 .content{padding:24px 32px}
 .section{margin-bottom:24px}
 .section-title{font-size:12px;font-weight:700;color:#1A2744;border-left:3px solid #C9A84C;padding-left:10px;margin-bottom:12px}
 .narrative{background:#FAF8F3;border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:16px;font-size:11px;line-height:1.6}
 .chart{background:#F1F5F9;border-radius:8px;height:140px;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-size:10px}
 .footer{background:#0F0F1A;padding:14px 32px;display:flex;justify-content:space-between;align-items:center;margin-top:auto}
 .footer-brand{color:#C9A84C;font-size:11px;font-weight:700;letter-spacing:2px}
 .footer-info{color:rgba(255,255,255,0.3);font-size:9px;text-align:right}
 </style></head><body>
 <div class='header'>
 <div>
 <div class='label'>${d.reportType==='relatorio'?'Relatorio de Resultados':d.reportType==='estudo'?'Estudo de Viabilidade':'Alerta de Risco'}</div>
 <div class='client'>${d.clientName}</div>
 <div class='meta'>${d.period} · ${d.portfolio}</div>
 </div>
 <div>
 ${d.aum?`<div class='aum'>${d.aum}</div><div style='color:rgba(255,255,255,0.4);font-size:10px;text-align:right'>AUM Total</div>`:''}
 ${d.retorno12m?`<div class='retorno'>+${d.retorno12m} (12m)</div>`:''}
 </div>
 </div>
 <div class='gold-bar'></div>
 <div class='kpis'>
 ${kpis.map(k=>`<div class='kpi'><div class='kpi-label'>${k.label}</div><div class='kpi-value'>${k.value}</div></div>`).join('')}
 </div>
 <div class='content'>
 <div class='section'>
 <div class='section-title'>Analise do Periodo — SILO Advisor IA</div>
 <div class='narrative'>${d.narrative}</div>
 </div>
 ${d.sections.map(sec=>`<div class='section'><div class='section-title'>${sec.title}</div>${sec.type==='chart_placeholder'?`<div class='chart'>[Grafico: ${sec.title}]</div>`:`<div class='narrative'>${sec.content}</div>`}</div>`).join('')}
 </div>
 <div class='footer'>
 <div class='footer-brand'>SILO MFO</div>
 <div class='footer-info'>Multi Family Office<br/>Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}</div>
 </div>
 </body></html>`;
}

export async function generateSiloPDF(data: SiloPDFData, outPath?: string): Promise<string> {
 const dir = process.env.REPORT_STORAGE_PATH || './reports_storage';
 await fs.mkdir(dir, {recursive:true});
 const file = outPath || path.join(dir, `silo_${data.clientName.replace(/\s+/g,'_')}_${Date.now()}.pdf`);
 
 const browser = await puppeteer.launch({headless:true, args:['--no-sandbox','--disable-setuid-sandbox']});
 const page = await browser.newPage();
 await page.setContent(buildHTML(data), {waitUntil:'networkidle0'});
 await page.pdf({path:file, format:'A4', printBackground:true,
 margin:{top:'0',right:'0',bottom:'0',left:'0'}});
 await browser.close();
 console.log('[PDF] Gerado:', file);
 return file;
}
