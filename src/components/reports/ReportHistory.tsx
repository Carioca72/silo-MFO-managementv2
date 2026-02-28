import { useState } from 'react';
import { Search, Download, Send, Eye, FileText,
 TrendingUp, ChevronDown, Filter } from 'lucide-react';

const HISTORY = [
 {id:'1',nome:'Relatório Mensal — Família Andrade',
 cliente:'Família Andrade',tipo:'Relatório',data:'28/02/2026',
 tools:['ExtratoCarteira022','VaR001','Markowitz001'],
 status:'enviado',canais:['email','whatsapp'],retorno:'+8.2%',var:'1.1%'},
 {id:'2',nome:'Estudo — Dr. Vasconcelos',
 cliente:'Dr. Eduardo Vasconcelos',tipo:'Estudo',data:'25/02/2026',
 tools:['AnaliseEstilo001','Markowitz001'],
 status:'enviado',canais:['email'],retorno:'—',var:'—'},
 {id:'3',nome:'Relatório — Instituto Brennand',
 cliente:'Instituto Brennand',tipo:'Relatório',data:'28/02/2026',
 tools:['ExtratoCarteira023','Duration001'],
 status:'enviado',canais:['email','whatsapp'],retorno:'+5.9%',var:'0.9%'},
 {id:'4',nome:'Alerta VaR — Holding Cerqueira',
 cliente:'Holding Cerqueira',tipo:'Alerta',data:'23/02/2026',
 tools:['Value_at_Risk001','StressTest001'],
 status:'pendente',canais:[],retorno:'+11.4%',var:'2.3%'},
 {id:'5',nome:'Estudo — Família Noronha',
 cliente:'Família Noronha',tipo:'Estudo',data:'15/01/2026',
 tools:['Markowitz001','LaminaRisco001'],
 status:'rascunho',canais:[],retorno:'—',var:'—'},
];

export default function ReportHistory() {
 const [search,setSearch] = useState('');
 const [typeF,setTypeF] = useState('Todos');
 const [statusF,setStatusF] = useState('Todos');
 const [expanded,setExpanded] = useState<string|null>(null);

 const filtered = HISTORY.filter(r => {
 const ms = r.nome.toLowerCase().includes(search.toLowerCase())||
 r.cliente.toLowerCase().includes(search.toLowerCase());
 const mt = typeF==='Todos'||r.tipo===typeF;
 const mst = statusF==='Todos'||r.status===statusF;
 return ms&&mt&&mst;
 });

 return (
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <div className="flex flex-wrap gap-3 items-center">
 <div className="relative flex-1 min-w-48">
 <Search size={15} className="absolute left-3 top-1/2
 -translate-y-1/2 text-gray-400"/>
 <input value={search} onChange={e=>setSearch(e.target.value)}
 placeholder="Buscar..."
 className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200
 rounded-lg focus:ring-1 focus:ring-[#C9A84C] outline-none"/>
 </div>
 <div className="flex gap-1.5">
 {['Todos','Relatório','Estudo','Alerta'].map(t=>(
 <button key={t} onClick={()=>setTypeF(t)}
 className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
 typeF===t
 ? 'bg-[#1A1A2E] text-white'
 : 'bg-gray-100 text-gray-600'}`}>{t}</button>
 ))}
 </div>
 <div className="flex gap-1.5">
 {['Todos','enviado','pendente','rascunho'].map(s=>(
 <button key={s} onClick={()=>setStatusF(s)}
 className={`px-3 py-1.5 text-xs rounded-lg font-medium
 capitalize ${statusF===s
 ? 'bg-[#C9A84C] text-[#0F0F1A]'
 : 'bg-gray-100 text-gray-600'}`}>{s}</button>
 ))}
 </div>
 </div>
 </div>
 <div className="space-y-2">
 {filtered.map(r=>(
 <div key={r.id} className="bg-white rounded-xl border
 border-gray-200 shadow-sm overflow-hidden">
 <div className="flex items-center gap-4 p-4 cursor-pointer
 hover:bg-gray-50"
 onClick={()=>setExpanded(expanded===r.id?null:r.id)}>
 <div className={`w-10 h-10 rounded-xl flex items-center
 justify-center flex-shrink-0 ${
 r.tipo==='Relatório'?'bg-blue-50':
 r.tipo==='Estudo'?'bg-emerald-50':'bg-amber-50'}`}>
 {r.tipo==='Relatório'
 ? <FileText size={18} className="text-blue-500"/>
 : r.tipo==='Estudo'
 ? <TrendingUp size={18} className="text-emerald-500"/>
 : <Filter size={18} className="text-amber-500"/>}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="text-sm font-semibold text-[#0F0F1A] truncate">
 {r.nome}
 </p>
 <span className={`text-[9px] font-bold px-2 py-0.5
 rounded-full flex-shrink-0 ${
 r.status==='enviado'?'bg-emerald-100 text-emerald-700':
 r.status==='pendente'?'bg-amber-100 text-amber-700':
 'bg-gray-100 text-gray-500'}`}>
 {r.status.toUpperCase()}
 </span>
 {r.canais.includes('email') &&
 <span className="text-[10px] bg-blue-100 text-blue-600
 px-1.5 py-0.5 rounded">■</span>}
 {r.canais.includes('whatsapp') &&
 <span className="text-[10px] bg-green-100 text-green-600
 px-1.5 py-0.5 rounded">■</span>}
 </div>
 <p className="text-xs text-gray-400 mt-0.5">
 {r.cliente} • {r.data} • {r.tools.length} ferramentas
 </p>
 </div>
 {r.retorno!=='—' && (
 <div className="hidden sm:flex gap-4 text-center flex-shrink-0">
 <div>
 <p className="text-[10px] text-gray-400">Retorno</p>
 <p className={`text-sm font-bold ${
 r.retorno.startsWith('+')?'text-emerald-600':'text-red-500'}`}>
 {r.retorno}
 </p>
 </div>
 <div>
 <p className="text-[10px] text-gray-400">VaR</p>
 <p className="text-sm font-bold text-gray-700">{r.var}</p>
 </div>
 </div>
 )}
 <div className="flex items-center gap-1.5 flex-shrink-0">
 <button className="p-1.5 hover:bg-gray-100 rounded-lg">
 <Eye size={15} className="text-gray-400"/>
 </button>
 <button className="p-1.5 hover:bg-gray-100 rounded-lg">
 <Download size={15} className="text-gray-400"/>
 </button>
 <button className="p-1.5 hover:bg-gray-100 rounded-lg">
 <Send size={15} className="text-gray-400"/>
 </button>
 <ChevronDown size={16} className={`text-gray-300 ml-1
 transition-transform ${expanded===r.id?'rotate-180':''}`}/>
 </div>
 </div>
 {expanded===r.id && (
 <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50">
 <p className="text-[10px] font-semibold text-gray-500 uppercase
 tracking-wide mb-2">Ferramentas utilizadas</p>
 <div className="flex flex-wrap gap-1">
 {r.tools.map(f=>(
 <span key={f} className="text-[10px] bg-[#1A1A2E]
 text-[#C9A84C] px-2 py-0.5 rounded-full">{f}</span>
 ))}
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 );
}
