import { useState } from 'react';
import { Plus, Play, Zap, CheckCircle, Clock,
 ChevronDown } from 'lucide-react';
import FlowBuilder from './FlowBuilder';

interface Job {
 id:string; nome:string; cronExpr:string; active:boolean;
 lastRun?:string; nextRun?:string; status:'idle'|'running';
 nodes:string[];
}

const JOBS:Job[] = [
 {id:'j1',nome:'Relatório Mensal — Todos os Clientes',
 cronExpr:'0 9 28 * *',active:true,
 lastRun:'28/01/2026 09:00',nextRun:'28/02/2026 09:00',
 status:'idle',
 nodes:['Trigger Cron','Buscar Clientes','Loop por Cliente',
 'ComDinheiro: ExtratoCarteira022','Gemini: Narrativa',
 'Gerar PDF','Enviar E-mail','Enviar WhatsApp','Log']},
 {id:'j2',nome:'Alerta VaR Semanal',
 cronExpr:'0 8 * * 1',active:true,
 lastRun:'17/02/2026 08:00',nextRun:'24/02/2026 08:00',
 status:'idle',
 nodes:['Trigger Cron','ComDinheiro: VaR001',
 'Verificar Threshold','Se excedido: WhatsApp Alerta']},
 {id:'j3',nome:'Estudo Pré-Contrato',
 cronExpr:'manual',active:false,status:'idle',
 nodes:['Trigger Manual','ComDinheiro: Markowitz001',
 'ComDinheiro: VaR001','Gemini: Gerar Estudo',
 'Exportar PDF','E-mail ao Prospecto']},
];

const COLORS: Record<string,string> = {
 'Trigger':'bg-purple-100 text-purple-700',
 'ComDinheiro':'bg-blue-100 text-blue-700',
 'Buscar':'bg-indigo-100 text-indigo-700',
 'Loop':'bg-gray-100 text-gray-700',
 'Gemini':'bg-amber-100 text-amber-700',
 'Gerar':'bg-orange-100 text-orange-700',
 'Exportar':'bg-pink-100 text-pink-700',
 'Enviar':'bg-green-100 text-green-700',
 'E-mail':'bg-blue-100 text-blue-700',
 'WhatsApp':'bg-green-100 text-green-700',
 'Verificar':'bg-red-100 text-red-700',
 'Se':'bg-yellow-100 text-yellow-700',
 'Log':'bg-gray-100 text-gray-500',
};

function nodeColor(n:string):string {
 const k = Object.keys(COLORS).find(k=>n.startsWith(k));
 return k ? COLORS[k] : 'bg-gray-100 text-gray-600';
}

export default function AutomationFlow() {
 const [jobs,setJobs] = useState<Job[]>(JOBS);
 const [expanded,setExpanded] = useState<string|null>(null);
 const [running,setRunning] = useState<string|null>(null);
 const [view, setView] = useState<'list'|'create'>('list');

 const toggle = (id:string) =>
 setJobs(p=>p.map(j=>j.id===id?{...j,active:!j.active}:j));

 const run = async (id:string) => {
 setRunning(id);
 setJobs(p=>p.map(j=>j.id===id?{...j,status:'running'}:j));
 await fetch(`/api/automation/${id}/run`,{method:'POST'}).catch(()=>{});
 await new Promise(r=>setTimeout(r,3000));
 setJobs(p=>p.map(j=>j.id===id
 ?{...j,status:'idle',lastRun:new Date().toLocaleString('pt-BR')}:j));
 setRunning(null);
 };

 return (
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm flex gap-1 mb-4">
 {[{k:'list',l:'Fluxos Ativos'},{k:'create',l:'+ Criar Fluxo IA'}].map(t=>(
 <button key={t.k} onClick={()=>setView(t.k as any)}
 className={`flex-1 py-2 text-xs font-medium rounded-lg ${ view===t.k?'bg-[#C9A84C] text-[#0F0F1A]':'text-gray-500 hover:bg-gray-50'}`}>
 {t.l}
 </button>
 ))}
 </div>

 {view==='create' && (
 <FlowBuilder onSave={(newFlow) => {
 // Adiciona o novo fluxo a lista local
 setJobs(p=>[...p, {...newFlow, status:'idle', executions:[]}]);
 setView('list');
 }}/>
 )}

 {view==='list' && (
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4
 shadow-sm flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-[#0F0F1A] text-sm">
 Central de Automações
 </h3>
 <p className="text-xs text-gray-400">
 {jobs.filter(j=>j.active).length} fluxos ativos • node-cron
 </p>
 </div>
 <button onClick={()=>setView('create')}
 className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold
 bg-[#C9A84C] text-[#0F0F1A] rounded-lg">
 <Plus size={14}/> Novo Fluxo
 </button>
 </div>
 <div className="space-y-3">
 {jobs.map(job=>(
 <div key={job.id} className="bg-white rounded-xl border
 border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 flex items-center gap-3">
 <div className={`w-9 h-9 rounded-lg flex items-center
 justify-center flex-shrink-0 ${
 job.status==='running'?'bg-blue-100':
 job.active?'bg-emerald-100':'bg-gray-100'}`}>
 {job.status==='running'
 ?<Zap size={18} className="text-blue-600 animate-pulse"/>
 :job.active
 ?<CheckCircle size={18} className="text-emerald-600"/>
 :<Clock size={18} className="text-gray-400"/>}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-[#0F0F1A] truncate">
 {job.nome}
 </p>
 <p className="text-xs text-gray-400">
 <code className="bg-gray-100 px-1 rounded text-[10px]">
 {job.cronExpr}
 </code>
 {job.lastRun && ` • Últ: ${job.lastRun}`}
 </p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <button onClick={()=>run(job.id)}
 disabled={running===job.id}
 className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50">
 <Play size={14} className="text-[#C9A84C]"/>
 </button>
 <button onClick={()=>toggle(job.id)}
 className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
 job.active
 ?'bg-emerald-100 text-emerald-700'
 :'bg-gray-100 text-gray-500'}`}>
 {job.active?'ATIVO':'PAUSADO'}
 </button>
 <button onClick={()=>
 setExpanded(expanded===job.id?null:job.id)}
 className="p-1.5 hover:bg-gray-100 rounded-lg">
 <ChevronDown size={14} className={`text-gray-400
 transition-transform ${expanded===job.id?'rotate-180':''}`}/>
 </button>
 </div>
 </div>
 {expanded===job.id && (
 <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50">
 <p className="text-[10px] font-semibold text-gray-500 uppercase
 tracking-wide mb-3">Nós do Fluxo</p>
 <div className="flex flex-wrap items-center gap-1">
 {job.nodes.map((node,i)=>(
 <div key={i} className="flex items-center gap-1">
 <span className={`text-[10px] font-medium px-2.5 py-1.5
 rounded-full ${nodeColor(node)}`}>
 {node}
 </span>
 {i<job.nodes.length-1 && (
 <span className="text-gray-300 text-xs">→</span>
 )}
 </div>
 ))}
 </div>
 {running===job.id && (
 <div className="mt-3 flex items-center gap-2 text-xs
 text-blue-600">
 <Zap size={13} className="animate-pulse"/>
 Executando fluxo...
 </div>
 )}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
