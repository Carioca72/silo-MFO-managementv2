import { useState } from 'react';
import { Plus, QrCode, Wifi, WifiOff, Send, RefreshCw } from 'lucide-react';

type Status = 'disconnected'|'qr'|'connected';
interface Session { id:string;nome:string;status:Status;numero?:string; }

const MOCK:Session[] = [
 {id:'s1',nome:'Silo — Principal',status:'connected',numero:'+55 81 3333-0001'},
 {id:'s2',nome:'Silo — Relatórios',status:'disconnected'},
];

export default function WhatsAppManager() {
 const [sessions,setSessions] = useState<Session[]>(MOCK);
 const [selSess,setSelSess] = useState<Session|null>(null);
 const [to,setTo] = useState('');
 const [msg,setMsg] = useState('');
 const [sending,setSending] = useState(false);
 const [log,setLog] = useState<{to:string;status:string;ts:string}[]>([]);

 const connect = async (id:string) => {
 setSessions(p=>p.map(s=>s.id===id?{...s,status:'qr'}:s));
 // Produção: socket.on('wa:qr:'+id, ({qr})=>renderQR(qr))
 setTimeout(()=>setSessions(p=>p.map(s=>s.id===id
 ?{...s,status:'connected',numero:'+55 81 9'+Math.floor(Math.random()*99999999)}
 :s)), 10000);
 };

 const sendMsg = async () => {
 if (!selSess||!to||!msg) return;
 setSending(true);
 try {
 await fetch(`/api/wa/sessions/${selSess.id}/send`,{
 method:'POST', headers:{'Content-Type':'application/json'},
 body:JSON.stringify({to,message:msg})
 });
 setLog(p=>[{to,status:'enviado',
 ts:new Date().toLocaleTimeString('pt-BR')},...p]);
 setTo(''); setMsg('');
 } catch {
 setLog(p=>[{to,status:'erro',
 ts:new Date().toLocaleTimeString('pt-BR')},...p]);
 }
 await new Promise(r=>setTimeout(r,800));
 setSending(false);
 };

 return (
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm
 flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-[#0F0F1A] text-sm">
 Sessões WhatsApp
 </h3>
 <p className="text-xs text-gray-400">
 {sessions.filter(s=>s.status==='connected').length} de
 {sessions.length} conectadas
 </p>
 </div>
 <button onClick={()=>setSessions(p=>[...p,
 {id:'s'+Date.now(),nome:'Nova Sessão',status:'disconnected'}])}
 className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold
 bg-[#C9A84C] text-[#0F0F1A] rounded-lg">
 <Plus size={14}/> Nova Sessão
 </button>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="space-y-3">
 {sessions.map(sess=>(
 <div key={sess.id} className={`bg-white rounded-xl border
 shadow-sm overflow-hidden ${selSess?.id===sess.id
 ?'border-[#C9A84C]':'border-gray-200'}`}>
 <div className="p-4 flex items-center gap-3 cursor-pointer"
 onClick={()=>setSelSess(sess)}>
 <div className={`w-10 h-10 rounded-full flex items-center
 justify-center flex-shrink-0 ${
 sess.status==='connected'?'bg-emerald-100':
 sess.status==='qr'?'bg-amber-100':'bg-gray-100'}`}>
 {sess.status==='connected'
 ?<Wifi size={18} className="text-emerald-600"/>
 :<WifiOff size={18} className="text-gray-400"/>}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-[#0F0F1A]">
 {sess.nome}
 </p>
 <p className="text-xs text-gray-400">
 {sess.status==='connected'&&sess.numero
 ?sess.numero
 :sess.status==='qr'?'■ Aguardando QR'
 :'Desconectado'}
 </p>
 </div>
 <span className={`text-[10px] font-bold px-2 py-0.5
 rounded-full flex-shrink-0 ${
 sess.status==='connected'?'bg-emerald-100 text-emerald-700':
 sess.status==='qr'?'bg-amber-100 text-amber-700':
 'bg-gray-100 text-gray-500'}`}>
 {sess.status.toUpperCase()}
 </span>
 </div>
 {sess.status==='qr' && (
 <div className="px-4 pb-4 border-t border-gray-100 pt-3
 flex flex-col items-center gap-3">
 <div className="w-40 h-40 bg-white border-2 border-[#C9A84C]
 rounded-xl flex flex-col items-center justify-center gap-2">
 <QrCode size={72} className="text-[#1A1A2E]"/>
 <p className="text-[9px] text-gray-400">QR via WebSocket</p>
 </div>
 <p className="text-xs text-gray-500 text-center">
 Aponte o WhatsApp para o QR. Atualiza a cada 30s.
 </p>
 </div>
 )}
 {sess.status==='disconnected' && (
 <div className="px-4 pb-4 border-t border-gray-100 pt-3">
 <button onClick={()=>connect(sess.id)}
 className="w-full py-2 bg-[#1A1A2E] text-white text-xs
 font-medium rounded-lg flex items-center justify-center gap-2">
 <QrCode size={13}/> Gerar QR Code
 </button>
 </div>
 )}
 </div>
 ))}
 </div>
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-3">
 Enviar Mensagem
 </h3>
 <div className="space-y-3">
 <div>
 <label className="text-xs text-gray-500">Sessão de Envio</label>
 <select value={selSess?.id||''}
 onChange={e=>setSelSess(
 sessions.find(s=>s.id===e.target.value)||null)}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg
 px-3 py-2 outline-none">
 <option value="">Selecionar sessão...</option>
 {sessions.filter(s=>s.status==='connected').map(s=>(
 <option key={s.id} value={s.id}>{s.nome}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs text-gray-500">
 Número (ex: 5581999990001)
 </label>
 <input value={to} onChange={e=>setTo(e.target.value)}
 placeholder="5581999990001"
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg
 px-3 py-2 outline-none"/>
 </div>
 <div>
 <label className="text-xs text-gray-500">Mensagem</label>
 <textarea value={msg} onChange={e=>setMsg(e.target.value)}
 placeholder="Olá! Segue seu relatório..." rows={4}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg
 px-3 py-2 outline-none resize-none"/>
 </div>
 <button onClick={sendMsg}
 disabled={!selSess||!to||!msg||sending}
 className="w-full bg-[#C9A84C] text-[#0F0F1A] font-bold py-2.5
 rounded-lg text-sm disabled:opacity-50
 flex items-center justify-center gap-2">
 {sending
 ?<><RefreshCw size={14} className="animate-spin"/> Enviando...</>
 :<><Send size={14}/> Enviar</>}
 </button>
 </div>
 </div>
 {log.length>0 && (
 <div className="bg-white rounded-xl border border-gray-200
 p-4 shadow-sm">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-3">
 Log
 </h3>
 <div className="space-y-2 max-h-40 overflow-y-auto">
 {log.map((l,i)=>(
 <div key={i} className="flex items-center gap-2 text-xs
 p-2 bg-gray-50 rounded-lg">
 <span className={`font-bold ${
 l.status==='enviado'?'text-emerald-600':'text-red-500'}`}>
 {l.status==='enviado'?'✓':'✗'}
 </span>
 <span className="flex-1 text-gray-700 truncate">{l.to}</span>
 <span className="text-gray-400">{l.ts}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
