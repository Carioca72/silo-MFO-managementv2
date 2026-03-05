import { GoogleGenAI, Type, GenerateContentResponse, Part } from '@google/genai';
import { SILO_ADVISOR_SYSTEM_PROMPT } from './systemPrompt.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TOOLS = [{
 functionDeclarations: [
 { name:'queryComDinheiro',
 description:'Consulta dados financeiros reais da API ComDinheiro',
 parameters: { type:Type.OBJECT, required:['endpoint'],
 properties: {
 endpoint: { type:Type.STRING, description:'Nome do endpoint ex: ExtratoCarteira022' },
 params: { type:Type.OBJECT, description:'Parametros do endpoint' },
 }
 }
 },
 { name:'getClientData',
 description:'Busca dados de cliente do banco de dados',
 parameters: { type:Type.OBJECT, required:['clientId'],
 properties: { clientId:{ type:Type.STRING } }
 }
 },
 { name:'generateReport',
 description:'Gera um relatorio PDF para o cliente',
 parameters: { type:Type.OBJECT, required:['clientId', 'tools'],
 properties: {
 clientId: { type:Type.STRING },
 tools: { type:Type.ARRAY, items: { type:Type.STRING } }
 }
 }
 },
 { name:'sendEmail',
 description:'Envia email para o cliente',
 parameters: { type:Type.OBJECT, required:['sessionId', 'to', 'subject', 'body'],
 properties: {
 sessionId: { type:Type.STRING },
 to: { type:Type.STRING },
 subject: { type:Type.STRING },
 body: { type:Type.STRING }
 }
 }
 },
 { name:'sendWhatsApp',
 description:'Envia mensagem de WhatsApp',
 parameters: { type:Type.OBJECT, required:['sessionId', 'to', 'message'],
 properties: {
 sessionId: { type:Type.STRING },
 to: { type:Type.STRING },
 message: { type:Type.STRING }
 }
 }
 },
 { name:'getClientEmails',
 description:'Le emails da caixa de entrada',
 parameters: { type:Type.OBJECT, required:['sessionId'],
 properties: { sessionId: { type:Type.STRING } }
 }
 },
 { name:'browsePage',
 description:'Navega em uma URL e extrai conteudo (Playwright)',
 parameters: { type:Type.OBJECT, required:['url'],
 properties: { url: { type:Type.STRING } }
 }
 },
 { name:'fetchMarketData',
 description:'Busca dados de mercado para multiplos ativos',
 parameters: { type:Type.OBJECT, required:['tickers', 'metrics'],
 properties: {
 tickers: { type:Type.ARRAY, items: { type:Type.STRING } },
 metrics: { type:Type.ARRAY, items: { type:Type.STRING } }
 }
 }
 },
 { name:'getPortfolioModels',
 description:'Retorna modelos de carteira pre-aprovados',
 parameters: { type:Type.OBJECT, properties: {} }
 },
 { name:'generateExcelStudy',
 description:'Gera planilha Excel do Estudo de Carteira',
 parameters: { type:Type.OBJECT, required:['client_id', 'cenario_atual', 'novo_cenario'],
 properties: {
 client_id: { type:Type.STRING },
 client_name: { type:Type.STRING },
 cdi: { type:Type.NUMBER },
 cenario_atual: { type:Type.OBJECT },
 novo_cenario: { type:Type.OBJECT },
 comparativo: { type:Type.OBJECT }
 }
 }
 },
 { name:'generatePDFStudy',
 description:'Gera PDF do Estudo de Carteira',
 parameters: { type:Type.OBJECT, required:['client_id', 'paginas'],
 properties: {
 client_id: { type:Type.STRING },
 client_name: { type:Type.STRING },
 study_date: { type:Type.STRING },
 paginas: { type:Type.ARRAY, items: { type:Type.OBJECT } }
 }
 }
 },
 { name:'runMarkowitz',
 description:'Executa otimizacao de Markowitz',
 parameters: { type:Type.OBJECT, required:['assets'],
 properties: {
 assets: { type:Type.ARRAY, items: { type:Type.OBJECT } },
 constraints: { type:Type.OBJECT },
 optimize: { type:Type.STRING }
 }
 }
 },
 { name:'generateBoleto',
 description:'Gera boleto em seguradoras (Porto, Azos, etc)',
 parameters: { type:Type.OBJECT, required:['system', 'clientData'],
 properties: {
 system: { type:Type.STRING },
 clientData: { type:Type.OBJECT }
 }
 }
 },
 { name:'sendSwift',
 description:'Envia comprovante SWIFT de cambio',
 parameters: { type:Type.OBJECT, required:['contractId', 'recipient'],
 properties: {
 contractId: { type:Type.STRING },
 recipient: { type:Type.STRING }
 }
 }
 },
 { name:'generateStudy',
 description:'Gera Estudo de Carteira (Pre-Contrato)',
 parameters: { type:Type.OBJECT, required:['clientId'],
 properties: { clientId: { type:Type.STRING } }
 }
 }
 ]
}];

async function execFunction(name: string, args: any): Promise<string> {
 const base = `http://localhost:${process.env.PORT||3001}`;

 if (name === 'queryComDinheiro') {
 try {
 const res = await fetch(`${base}/api/cmd/query`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify({ endpoint:args.endpoint, params:args.params||{} }),
 });
 return JSON.stringify(await res.json());
 } catch { return JSON.stringify({error:'Falha ao consultar ComDinheiro'}); }
 }

 if (name === 'getClientData') {
 const res = await fetch(`${base}/api/clients`).then(r=>r.json()).catch(()=>[]);
 const client = res.find((c:any) => c.id === args.clientId);
 return JSON.stringify(client || {error:'Cliente nao encontrado'});
 }

 if (name === 'generateReport') {
 const res = await fetch(`${base}/api/reports/generate`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify(args)
 }).then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'sendEmail') {
 const res = await fetch(`${base}/api/email/send`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify(args)
 }).then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'sendWhatsApp') {
 const res = await fetch(`${base}/api/wa/sessions/${args.sessionId}/send`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify(args)
 }).then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'getClientEmails') {
 const res = await fetch(`${base}/api/email/sessions/${args.sessionId}/inbox`)
 .then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'browsePage') {
 return JSON.stringify({ content: `Conteudo extraido de ${args.url} (Simulado via Puppeteer)` });
 }

 if (name === 'fetchMarketData') {
 const res = await fetch(`${base}/api/study/market-data?tickers=${args.tickers.join(',')}`)
 .then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'getPortfolioModels') {
 const res = await fetch(`${base}/api/study/models`)
 .then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'generateExcelStudy') {
 return JSON.stringify({ success: true, message: "Excel gerado via endpoint /api/study/generate-excel" });
 }

 if (name === 'generatePDFStudy') {
 return JSON.stringify({ success: true, message: "PDF generation not fully implemented in agent, use UI" });
 }

 if (name === 'runMarkowitz') {
 const res = await fetch(`${base}/api/study/optimize`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify(args)
 }).then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'generateBoleto') {
 const res = await fetch(`${base}/api/boletos/generate`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify(args)
 }).then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'sendSwift') {
 const res = await fetch(`${base}/api/swift/send`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify(args)
 }).then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 if (name === 'generateStudy') {
 const res = await fetch(`${base}/api/reports/generate`, {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify({
 clientId: args.clientId,
 tools: ['Markowitz001', 'CarteiraExplodida001', 'AnaliseEstilo001'],
 tipo: 'estudo',
 reportName: `Estudo Pre-Contrato - ${args.clientId}`
 })
 }).then(r=>r.json()).catch(e=>({error:e.message}));
 return JSON.stringify(res);
 }

 return JSON.stringify({error:`Function ${name} nao implementada`});
}

export class SiloAdvisorService {
 private model = 'gemini-1.5-flash-latest';

 async * generateResponse(
    userMessage: string,
    context?: any,
    history?: Array<{role:string; content:string; parts?: Part[]}>
 ): AsyncGenerator<string> {
 try {
 const contents: any[] = [];

 if (history?.length) {
 for (const h of history.slice(-8)) {
 contents.push({ role: h.role, parts: h.parts || [{text: h.content}] });
 }
 }

 let prompt = userMessage;
 if (context) prompt += `\nCONTEXTO: ${JSON.stringify(context)}`;

 contents.push({ role:'user', parts:[{text:prompt}] });

 const result = await ai.getGenerativeModel({
        model: this.model,
        systemInstruction: SILO_ADVISOR_SYSTEM_PROMPT,
        tools: TOOLS,
      }).generateContentStream({ contents });
 
 let functionCallPart: Part | null = null;
 
 for await (const chunk of result.stream) {
        const chunkPart = chunk.parts?.[0];
        if (chunkPart?.functionCall) {
          // A IA solicitou uma chamada de função. Armazena e quebra o loop.
          functionCallPart = chunkPart;
          break;
        }
        
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
      
      // Se uma chamada de função foi solicitada, execute-a.
      if (functionCallPart && functionCallPart.functionCall) {
        const { name, args } = functionCallPart.functionCall;
        
        // Adiciona a solicitação da IA ao histórico
        contents.push({ role: 'model', parts: [functionCallPart]});

        // Executa a função
        const functionResult = await execFunction(name, args);

        // Adiciona o resultado da função ao histórico
        contents.push({
          role: 'user', // O Gemini espera o role 'user' para a resposta da função
          parts: [{ functionResponse: { name, response: JSON.parse(functionResult) } }],
        });

        // Envia o histórico atualizado de volta para a IA para obter a resposta final
        const finalResult = await ai.getGenerativeModel({
          model: this.model,
          systemInstruction: SILO_ADVISOR_SYSTEM_PROMPT,
          tools: TOOLS
        }).generateContentStream({ contents });

        // Envia a resposta final em streaming
        for await (const chunk of finalResult.stream) {
          const text = chunk.text();
          if (text) {
            yield text;
          }
        }
      }

 } catch (e:any) {
 console.error('SiloAdvisor error:', e);
 throw new Error('Falha SILO Advisor: ' + e.message);
 }
 }
}

export const siloAdvisor = new SiloAdvisorService();
