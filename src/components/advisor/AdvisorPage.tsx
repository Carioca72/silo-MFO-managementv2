import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, FileText, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../../services/api';

interface Message { role:'user'|'assistant'; content:string; ts:string; }

const QUICK = [
 'Analise o risco da carteira Familia Andrade',
 'Recomende ferramentas para relatorio mensal',
 'Calcule VaR 95% para Holding Cerqueira',
 'Gere estudo de viabilidade — perfil moderado R$10M',
 'Compare retorno das carteiras vs CDI ultimo ano',
];

// Renderizador markdown simples sem dependencia extra
function MdText({ text }: { text: string }) {
 const html = text
 .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
 .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:11px">$1</code>')
 .replace(/^#{2} (.+)$/gm, '<p style="font-weight:700;font-size:13px;color:#0F0F1A;margin:8px 0 3px">$1</p>')
 .replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:1px 0">• $1</div>')
 .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
 return <div dangerouslySetInnerHTML={{ __html: html }}
 style={{ lineHeight:'1.6', fontSize:'13px' }} />;
}

export default function AdvisorPage() {
 const [messages, setMessages] = useState<Message[]>([{
 role:'assistant', ts: new Date().toLocaleTimeString('pt-BR'),
 content:'## SILO Advisor\n\nOla! Sou seu assistente de inteligencia financeira.\nTenho acesso aos dados ComDinheiro e posso gerar relatorios, analisar riscos e automatizar tarefas.'
 }]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [stream, setStream] = useState('');
 const endRef = useRef<HTMLDivElement>(null);
 const abortRef = useRef<AbortController|null>(null);

 useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); },
 [messages, stream]);

 const send = async (text?: string) => {
 const msg = text || input;
 if (!msg.trim() || loading) return;
 setInput('');
 const userMsg: Message = { role:'user', content:msg,
 ts: new Date().toLocaleTimeString('pt-BR') };
 const history = [...messages, userMsg];
 setMessages(history);
 setLoading(true); setStream('');
 
 abortRef.current = new AbortController();
 try {
 const res = await fetch(getApiUrl('/advisor/chat'), {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify({
 message: msg,
 history: history.slice(-10).map(m=>({role:m.role,content:m.content})),
 }),
 signal: abortRef.current.signal,
 });
 const data = await res.json();
 const reply = data.response || data.error || 'Erro ao processar.';
 
 // Simula streaming token-a-token
 let displayed = '';
 for (const word of reply.split(' ')) {
 displayed += (displayed ? ' ' : '') + word;
 setStream(displayed);
 await new Promise(r => setTimeout(r, 18));
 if (abortRef.current?.signal.aborted) break;
 }
 setMessages(p => [...p, { role:'assistant', content:reply,
 ts: new Date().toLocaleTimeString('pt-BR') }]);
 setStream('');
 } catch (e: any) {
 if (e.name !== 'AbortError')
 setMessages(p => [...p, { role:'assistant',
 content:'Erro de conexao. Verifique se o servidor esta rodando.',
 ts: new Date().toLocaleTimeString('pt-BR') }]);
 setStream('');
 }
 setLoading(false);
 };

 const clear = () => {
 abortRef.current?.abort();
 setMessages([{ role:'assistant', content:'Conversa reiniciada.',
 ts: new Date().toLocaleTimeString('pt-BR') }]);
 setStream(''); setLoading(false);
 };

 return (
 <div className="flex gap-4" style={{height:'calc(100vh - 8rem)'}}>
 {/* Chat principal */}
 <div className="flex-1 bg-white rounded-xl border border-gray-200
 shadow-sm flex flex-col overflow-hidden">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-[#C9A84C] rounded-full flex items-center justify-center">
 <Bot size={18} className="text-[#0F0F1A]"/>
 </div>
 <div>
 <p className="font-semibold text-[#0F0F1A] text-sm">SILO Advisor</p>
 <p className="text-[10px] text-gray-400">
 Gemini 2.5 Flash · {messages.length - 1} mensagens na sessao
 </p>
 </div>
 </div>
 <button onClick={clear} title="Limpar conversa"
 className="p-1.5 hover:bg-gray-100 rounded-lg">
 <Trash2 size={14} className="text-gray-400"/>
 </button>
 </div>
 
 {/* Mensagens */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {messages.map((m, i) => (
 <div key={i} className={`flex gap-3 ${m.role==='user'?'flex-row-reverse':''}`}>
 <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
 m.role==='assistant' ? 'bg-[#1A1A2E]' : 'bg-[#F4F1EB]'}`}>
 {m.role==='assistant'
 ? <Bot size={14} className="text-white"/>
 : <User size={14} className="text-[#C9A84C]"/>}
 </div>
 <div className={`max-w-[82%] px-4 py-3 rounded-xl ${ m.role==='user'
 ? 'bg-[#1A1A2E] text-white rounded-tr-none'
 : 'bg-[#F4F1EB] border border-[#C9A84C]/15 rounded-tl-none'}`}>
 {m.role==='assistant'
 ? <MdText text={m.content}/>
 : <p className="text-sm leading-relaxed">{m.content}</p>}
 <p className={`text-[10px] mt-1.5 ${ m.role==='user'?'text-white/40':'text-gray-400'}`}>{m.ts}</p>
 </div>
 </div>
 ))}
 
 {stream && (
 <div className="flex gap-3">
 <div className="w-7 h-7 bg-[#1A1A2E] rounded-full flex items-center justify-center flex-shrink-0">
 <Bot size={14} className="text-white"/>
 </div>
 <div className="max-w-[82%] bg-[#F4F1EB] border border-[#C9A84C]/15 rounded-xl rounded-tl-none px-4 py-3">
 <MdText text={stream}/>
 <span className="inline-block w-1.5 h-3.5 bg-[#C9A84C] ml-0.5 animate-pulse rounded-sm"/>
 </div>
 </div>
 )}
 
 {loading && !stream && (
 <div className="flex gap-3">
 <div className="w-7 h-7 bg-[#1A1A2E] rounded-full flex items-center justify-center flex-shrink-0">
 <Bot size={14} className="text-white"/>
 </div>
 <div className="bg-[#F4F1EB] border border-[#C9A84C]/15 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
 <RefreshCw size={13} className="text-[#C9A84C] animate-spin"/>
 <span className="text-xs text-gray-500">Analisando dados...</span>
 </div>
 </div>
 )}
 <div ref={endRef}/>
 </div>
 
 {/* Input */}
 <div className="p-4 border-t border-gray-100">
 <div className="flex gap-2">
 <textarea value={input} onChange={e => setInput(e.target.value)}
 onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
 placeholder="Pergunte sobre carteiras, risco, benchmarks... (Enter envia)"
 rows={2}
 className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:ring-1 focus:ring-[#C9A84C] outline-none"/>
 <div className="flex flex-col gap-1.5">
 <button onClick={() => send()} disabled={!input.trim()||loading}
 className="p-2.5 bg-[#C9A84C] text-[#0F0F1A] rounded-xl hover:bg-[#b8942e] disabled:opacity-40">
 {loading ? <RefreshCw size={16} className="animate-spin"/> : <Send size={16}/>}
 </button>
 {loading && (
 <button onClick={() => { abortRef.current?.abort(); setLoading(false); setStream(''); }}
 className="p-2.5 bg-red-100 text-red-500 rounded-xl">X</button>
 )}
 </div>
 </div>
 </div>
 </div>
 
 {/* Painel lateral */}
 <div className="w-60 flex flex-col gap-4 flex-shrink-0">
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <h3 className="text-xs font-semibold text-[#0F0F1A] mb-3 flex items-center gap-2">
 <Sparkles size={13} className="text-[#C9A84C]"/> Consultas Rapidas
 </h3>
 <div className="space-y-1.5">
 {QUICK.map((q,i) => (
 <button key={i} onClick={() => send(q)}
 className="w-full text-left text-[11px] text-gray-600 p-2 rounded-lg
 hover:bg-[#C9A84C]/8 hover:text-[#0F0F1A] border border-transparent
 hover:border-[#C9A84C]/20 transition-all leading-relaxed">
 {q}
 </button>
 ))}
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <h3 className="text-xs font-semibold text-[#0F0F1A] mb-3 flex items-center gap-2">
 <FileText size={13} className="text-[#C9A84C]"/> Sessao Atual
 </h3>
 <div className="space-y-2 text-[11px] text-gray-500">
 {[['Modelo','Gemini 2.5 Flash'],['Mensagens',messages.length],['Endpoints','50+'],
 ['Status API','Online']].map(([l,v]) => (
 <div key={String(l)} className="flex justify-between">
 <span>{l}</span>
 <span className={`font-medium ${ String(l)==='Status API'?'text-emerald-600':'text-gray-700'}`}>{v}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}

