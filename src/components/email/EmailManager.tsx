import { useState } from 'react';
import { Mail, Plus, CheckCircle, Send, Settings, Eye } from 'lucide-react';

const SESSIONS = [
 {id:'es1',nome:'Silo MFO Principal',smtpHost:'smtp.gmail.com',
 smtpUser:'reports@silo.com.br',active:true,status:'ok'},
 {id:'es2',nome:'Silo — Alertas',smtpHost:'smtp.gmail.com',
 smtpUser:'alerts@silo.com.br',active:false,status:'untested'},
];

const INBOX = [
 {id:'m1',from:'cliente@andrade.com.br',subject:'Dúvida sobre rentabilidade',
 preview:'Olá, gostaria de entender...',date:'hoje 10:23',read:false},
 {id:'m2',from:'contato@brennand.org',subject:'Reunião de revisão',
 preview:'Podemos marcar para....',date:'ontem 16:45',read:true},
];

export default function EmailManager() {
 const [sessions,setSessions] = useState(SESSIONS);
 const [tab,setTab] = useState<'sessions'|'inbox'|'compose'|'templates'|'intelligence'>
 ('sessions');
 const [compose,setCompose] = useState({to:'',subject:'',body:''});
 const [sending,setSending] = useState(false);
 const [showConfig,setShowConfig] = useState(false);

 const sendEmail = async () => {
 setSending(true);
 try {
 await fetch('/api/email/send',{
 method:'POST', headers:{'Content-Type':'application/json'},
 body:JSON.stringify({sessionId:'es1',...compose})
 });
 alert('■ E-mail enviado!');
 setCompose({to:'',subject:'',body:''});
 } catch { alert('■ Erro ao enviar.'); }
 await new Promise(r=>setTimeout(r,1200));
 setSending(false);
 };

const [analysis, setAnalysis] = useState<any[]>([]);
 const [analyzing, setAnalyzing] = useState(false);

 const analyzeInbox = async () => {
 setAnalyzing(true);
 try {
 const res = await fetch('/api/email/analyze-inbox', {method:'POST'});
 const data = await res.json();
 setAnalysis(data.results || []);
 } catch { alert('Erro na analise.'); }
 setAnalyzing(false);
 };

 const TABS=[{k:'sessions',l:'Contas'},{k:'inbox',l:'Inbox'},
 {k:'compose',l:'Compor'},{k:'templates',l:'Templates'},
 {k:'intelligence',l:'IA Inbox'}];

 return (
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-1
 shadow-sm flex gap-1">
 {TABS.map(t=>(
 <button key={t.k} onClick={()=>setTab(t.k as any)}
 className={`flex-1 py-2 text-xs font-medium rounded-lg ${
 tab===t.k
 ?'bg-[#C9A84C] text-[#0F0F1A]'
 :'text-gray-500 hover:bg-gray-50'}`}>
 {t.l}
 </button>
 ))}
 </div>
 {tab==='intelligence' && (
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-[#0F0F1A] text-sm">Inteligencia de Inbox</h3>
 <p className="text-xs text-gray-400">IA analisa e categoriza emails automaticamente</p>
 </div>
 <button onClick={analyzeInbox} disabled={analyzing}
 className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0F0F1A] text-xs font-bold rounded-lg disabled:opacity-50">
 {analyzing ? 'Analisando...' : 'Analisar Inbox IA'}
 </button>
 </div>
 {analysis.map((item,i) => (
 <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ item.data.priority==='high'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-500'}`}>
 {item.data.priority?.toUpperCase()}
 </span>
 <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
 {item.data.category}
 </span>
 </div>
 <p className="text-sm font-medium">{item.data.extractedData?.clientName||'Nao identificado'}</p>
 <p className="text-xs text-gray-500 mt-1">{item.data.suggestedAction}</p>
 {item.data.endpointsNeeded?.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-2">
 {item.data.endpointsNeeded.map((ep:string) => (
 <span key={ep} className="text-[10px] bg-[#1A1A2E] text-[#C9A84C] px-2 py-0.5 rounded-full">{ep}</span>
 ))}
 </div>
 )}
 </div>
 <button className="px-3 py-1.5 bg-[#C9A84C] text-[#0F0F1A] text-[11px] font-bold rounded-lg">
 Executar Acao
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 {tab==='sessions' && (
 <div className="space-y-3">
 {sessions.map(s=>(
 <div key={s.id} className="bg-white rounded-xl border
 border-gray-200 p-4 shadow-sm flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center
 justify-center ${s.status==='ok'?'bg-emerald-50':'bg-gray-100'}`}>
 {s.status==='ok'
 ?<CheckCircle size={18} className="text-emerald-600"/>
 :<Mail size={18} className="text-gray-400"/>}
 </div>
 <div className="flex-1">
 <p className="text-sm font-semibold text-[#0F0F1A]">{s.nome}</p>
 <p className="text-xs text-gray-400">
 {s.smtpUser} • {s.smtpHost}
 </p>
 </div>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
 s.active?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>
 {s.active?'ATIVA':'INATIVA'}
 </span>
 <button onClick={()=>setShowConfig(true)}
 className="p-1.5 hover:bg-gray-100 rounded-lg">
 <Settings size={14} className="text-gray-400"/>
 </button>
 </div>
 ))}
 <button onClick={()=>setShowConfig(true)}
 className="w-full py-3 border border-dashed border-[#C9A84C]/40
 rounded-xl text-sm text-[#C9A84C] font-medium
 flex items-center justify-center gap-2">
 <Plus size={16}/> Adicionar Conta SMTP
 </button>
 </div>
 )}
 {tab==='inbox' && (
 <div className="bg-white rounded-xl border border-gray-200
 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100">
 <h3 className="text-sm font-semibold text-[#0F0F1A]">
 Inbox — Silo MFO Principal
 </h3>
 </div>
 {INBOX.map(m=>(
 <div key={m.id} className={`px-4 py-3.5 border-b border-gray-50
 cursor-pointer hover:bg-gray-50 ${!m.read?'bg-blue-50/30':''}`}>
 <div className="flex items-start gap-3">
 {!m.read && <div className="w-2 h-2 bg-blue-50 rounded-full
 flex-shrink-0 mt-1.5"/>}
 <div className="flex-1 min-w-0">
 <div className="flex justify-between">
 <p className={`text-sm truncate ${!m.read?'font-semibold':''}`}>
 {m.from}
 </p>
 <span className="text-xs text-gray-400 ml-2">{m.date}</span>
 </div>
 <p className="text-xs font-medium text-gray-700 truncate">
 {m.subject}
 </p>
 <p className="text-xs text-gray-400 truncate">{m.preview}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 {tab==='compose' && (
 <div className="bg-white rounded-xl border border-gray-200
 p-5 shadow-sm">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-4">
 Compor E-mail
 </h3>
 <div className="space-y-3">
 {[['to','Para','cliente@empresa.com.br'],
 ['subject','Assunto','Relatório Mensal — Fevereiro 2026']
 ].map(([k,l,ph])=>(
 <div key={k}>
 <label className="text-xs text-gray-500">{l}</label>
 <input value={(compose as any)[k]}
 onChange={e=>setCompose(p=>({...p,[k]:e.target.value}))}
 placeholder={ph}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg
 px-3 py-2 outline-none"/>
 </div>
 ))}
 <div>
 <label className="text-xs text-gray-500">Mensagem</label>
 <textarea value={compose.body}
 onChange={e=>setCompose(p=>({...p,body:e.target.value}))}
 placeholder="Prezado cliente, segue em anexo..."
 rows={8}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg
 px-3 py-2 outline-none resize-none"/>
 </div>
 <div className="flex gap-2">
 <button className="flex items-center gap-1.5 px-3 py-2 text-xs
 border border-gray-200 rounded-lg">
 <Eye size={13}/> Preview HTML
 </button>
 <button onClick={sendEmail}
 disabled={sending||!compose.to||!compose.subject}
 className="flex-1 bg-[#C9A84C] text-[#0F0F1A] font-bold py-2.5
 rounded-lg text-sm disabled:opacity-50
 flex items-center justify-center gap-2">
 {sending?'■ Enviando...':<><Send size={14}/> Enviar</>}
 </button>
 </div>
 </div>
 </div>
 )}
 {tab==='templates' && (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {['■ Relatório Mensal','■ Estudo de Carteira',
 '■■ Alerta VaR','■ Boas-vindas',
 '■ Reunião de Revisão','■ Proposta Comercial'].map(t=>(
 <div key={t} className="bg-white rounded-xl border border-gray-200
 p-4 shadow-sm hover:border-[#C9A84C] cursor-pointer">
 <p className="text-sm font-semibold text-[#0F0F1A] mb-1">{t}</p>
 <p className="text-xs text-gray-400">Template HTML Silo-branded</p>
 <button className="mt-3 w-full py-1.5 text-xs border
 border-gray-200 rounded-lg hover:bg-gray-50">Editar</button>
 </div>
 ))}
 </div>
 )}
 {showConfig && (
 <div className="fixed inset-0 bg-black/50 flex items-center
 justify-center z-50">
 <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
 <h3 className="font-bold text-[#0F0F1A] mb-4">
 Configurar Conta SMTP
 </h3>
 <div className="space-y-3">
 {[['Nome','Ex: Silo Principal'],['Servidor SMTP','smtp.gmail.com'],
 ['E-mail','reports@silo.com.br'],['Senha App','••••••••'],
 ['Servidor IMAP','imap.gmail.com']].map(([l,ph])=>(
 <div key={l}>
 <label className="text-xs text-gray-500">{l}</label>
 <input placeholder={ph} type={l==='Senha App'?'password':'text'}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg
 px-3 py-2 outline-none"/>
 </div>
 ))}
 </div>
 <div className="flex gap-2 mt-5">
 <button onClick={()=>setShowConfig(false)}
 className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">
 Cancelar
 </button>
 <button onClick={()=>setShowConfig(false)}
 className="flex-1 py-2 bg-[#C9A84C] text-[#0F0F1A] font-bold
 rounded-lg text-sm">
 Salvar
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
