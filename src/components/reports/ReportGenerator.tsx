import { useState } from 'react';
import { Search, ChevronRight, X, Check, CheckSquare, Square,
 FileText, User, Sparkles, BarChart2, Send, Download, Eye, Bot } from 'lucide-react';

type Step = 'tools' | 'client' | 'preview';

const TOOLS = [
 { id:'ext022', name:'ExtratoCarteira022', cat:'Extrato', icon:'■',
 desc:'Extrato MFO completo: posição, liquidez, movimentação, gráficos' },
 { id:'ext023', name:'ExtratoCarteira023', cat:'Extrato', icon:'■',
 desc:'Extrato consolidado com evolução vs benchmarks CDI/IBOV' },
 { id:'ext024', name:'ExtratoCarteira024', cat:'Extrato', icon:'■',
 desc:'Extrato executivo com alocação por tipo e gestor' },
 { id:'pos001', name:'PosicaoConsolidada001', cat:'Posição', icon:'■',
 desc:'Posição consolidada com aportes, resgates e IR/IOF' },
 { id:'var001', name:'Value_at_Risk001', cat:'Risco', icon:'■■',
 desc:'VaR 95% histórico para portfólio multi-ativo' },
 { id:'mkw001', name:'Markowitz001', cat:'Otimização', icon:'■',
 desc:'Fronteira eficiente e portfólio ótimo de Markowitz' },
 { id:'rco001', name:'Risco001', cat:'Risco', icon:'■',
 desc:'Matriz de correlação, covariância e risco×retorno' },
 { id:'drw001', name:'DrawDownAcumulado001', cat:'Risco', icon:'■',
 desc:'Série histórica de drawdown acumulado pico a vale' },
 { id:'str001', name:'StressTest001', cat:'Risco', icon:'■',
 desc:'Stress test com cenários de choque de mercado' },
 { id:'est001', name:'AnaliseEstilo001', cat:'Atribuição', icon:'■',
 desc:'Style analysis do fundo vs IBOV/CDI/IMA-B' },
 { id:'dur001', name:'Duration001', cat:'Renda Fixa', icon:'■',
 desc:'Duration Macaulay, Modificada e DV01 por vértice' },
 { id:'rlq001', name:'RiscoLiquidez001', cat:'Liquidez', icon:'■',
 desc:'Prazo médio de liquidação e risco de liquidez' },
 { id:'ger002', name:'RelatorioGerencial002', cat:'Gerencial', icon:'■',
 desc:'Relatório gerencial mensal com eventos' },
 { id:'lam021', name:'LaminaFundo021', cat:'Fundos', icon:'■',
 desc:'Lâmina completa do fundo com retornos e benchmarks' },
];

const CATS = ['Todos','Extrato','Posição','Risco','Otimização',
 'Atribuição','Renda Fixa','Liquidez','Gerencial','Fundos'];

const CLIENTS = [
 { id:'1', nome:'Família Andrade', cnpj:'12.345.678/0001-90',
 portfolio:'andrade_main', email:'gestao@andrade.com.br',
 telefone:'+55 81 99999-0001', aum:'R$ 12,4M', perfil:'Moderado' },
 { id:'2', nome:'Instituto Brennand', cnpj:'23.456.789/0001-12',
 portfolio:'brennand_fundo', email:'financeiro@brennand.org',
 telefone:'+55 81 99999-0002', aum:'R$ 8,7M', perfil:'Conservador' },
 { id:'3', nome:'Holding Cerqueira', cnpj:'34.567.890/0001-23',
 portfolio:'cerqueira_holding', email:'diretoria@cerqueira.com',
 telefone:'+55 81 99999-0003', aum:'R$ 21,3M', perfil:'Arrojado' },
 { id:'4', nome:'Família Magalhães', cnpj:'56.789.012/0001-45',
 portfolio:'magalhaes_fam', email:'patrimonial@magalhaes.com',
 telefone:'+55 81 99999-0005', aum:'R$ 15,8M', perfil:'Moderado' },
];

export default function ReportGenerator() {
 const [step, setStep] = useState<Step>('tools');
 const [selectedTools, setSelectedTools] = useState<string[]>(
 ['ext022','pos001','var001']);
 const [catFilter, setCatFilter] = useState('Todos');
 const [search, setSearch] = useState('');
 const [selectedClient, setSelectedClient] =
 useState<typeof CLIENTS[0]|null>(null);
 const [clientSearch, setClientSearch] = useState('');
 const [reportName, setReportName] = useState('');
 const [generating, setGenerating] = useState(false);
 const [generated, setGenerated] = useState(false);
 const [sendModal, setSendModal] = useState(false);
 const [advisorMsg, setAdvisorMsg] = useState('');
 const [advisorResp, setAdvisorResp] = useState<string|null>(null);

 const toggle = (id: string) => setSelectedTools(p =>
 p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

 const filtered = TOOLS.filter(t => {
 const mc = catFilter==='Todos' || t.cat===catFilter;
 const ms = t.name.toLowerCase().includes(search.toLowerCase()) ||
 t.desc.toLowerCase().includes(search.toLowerCase());
 return mc && ms;
 });

 const filteredClients = CLIENTS.filter(c =>
 c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
 c.cnpj.includes(clientSearch));

 const handleGenerate = async () => {
 if (!selectedClient) return;
 setGenerating(true);
 try {
 await fetch('/api/reports/generate', {
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify({
 clientId: selectedClient.id,
 tools: selectedTools,
 reportName: reportName || `Relatório ${selectedClient.nome}`,
 })
 });
 } catch(e) { console.error(e); }
 await new Promise(r => setTimeout(r, 2500));
 setGenerating(false); setGenerated(true); setStep('preview');
 };

 const handleAdvisor = async () => {
 if (!advisorMsg) return;
 await new Promise(r => setTimeout(r, 1200));
 setAdvisorResp('Recomendo: ExtratoCarteira022 (posição completa), ' +
 'Value_at_Risk001 (VaR 95%) e Markowitz001 (fronteira eficiente). ' +
 'Combinação ideal para relatório mensal perfil moderado.');
 setAdvisorMsg('');
 };

 const STEPS = [
 { key:'tools', label:'1. Ferramentas' },
 { key:'client', label:'2. Cliente' },
 { key:'preview', label:'3. Preview & Envio' },
 ];

 return (
 <div className="space-y-4">
 {/* Stepper */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <div className="flex items-center gap-2">
 {STEPS.map((s, i) => (
 <div key={s.key} className="flex items-center gap-2 flex-1">
 <button
 onClick={() => (s.key!=='preview'||generated) &&
 setStep(s.key as Step)}
 className={`flex items-center gap-2 px-3 py-2 rounded-lg
 text-sm font-medium transition-all ${
 step===s.key
 ? 'bg-[#C9A84C] text-[#0F0F1A]'
 : 'text-gray-700 hover:bg-gray-100'}`}
 >
 <span className={`w-5 h-5 rounded-full text-xs flex items-center
 justify-center font-bold flex-shrink-0 ${
 step===s.key
 ? 'bg-[#0F0F1A] text-[#C9A84C]'
 : 'bg-gray-200 text-gray-500'}`}>
 {i+1}
 </span>
 {s.label}
 </button>
 {i<2 && <ChevronRight size={16} className="text-gray-300
 flex-shrink-0"/>}
 </div>
 ))}
 </div>
 </div>

 {/* STEP 1 — FERRAMENTAS */}
 {step==='tools' && (
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 <div className="lg:col-span-3 bg-white rounded-xl border
 border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100">
 <div className="flex gap-2 mb-3">
 <div className="relative flex-1">
 <Search size={15} className="absolute left-3 top-1/2
 -translate-y-1/2 text-gray-400"/>
 <input value={search} onChange={e=>setSearch(e.target.value)}
 placeholder="Buscar endpoint..."
 className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200
 rounded-lg focus:ring-1 focus:ring-[#C9A84C] outline-none"/>
 </div>
 <span className="text-xs text-gray-400 self-center">
 {selectedTools.length} selecionadas
 </span>
 </div>
 <div className="flex gap-1 flex-wrap">
 {CATS.map(c => (
 <button key={c} onClick={()=>setCatFilter(c)}
 className={`px-2.5 py-1 text-xs rounded-full font-medium
 transition-all ${catFilter===c
 ? 'bg-[#1A1A2E] text-white'
 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
 {c}
 </button>
 ))}
 </div>
 </div>
 <div className="overflow-y-auto" style={{maxHeight:'440px'}}>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
 {filtered.map(tool => {
 const sel = selectedTools.includes(tool.id);
 return (
 <div key={tool.id} onClick={()=>toggle(tool.id)}
 className={`flex items-start gap-3 p-3 rounded-xl border
 cursor-pointer transition-all ${sel
 ? 'border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm'
 : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
 <span className="text-lg flex-shrink-0">{tool.icon}</span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1 mb-0.5">
 <p className="text-xs font-bold text-[#0F0F1A]
 truncate">{tool.name}</p>
 <span className="text-[9px] bg-gray-200 text-gray-600
 px-1.5 py-0.5 rounded-full flex-shrink-0">
 {tool.cat}
 </span>
 </div>
 <p className="text-[11px] text-gray-500 leading-relaxed">
 {tool.desc}
 </p>
 </div>
 {sel
 ? <CheckSquare size={16} className="text-[#C9A84C]
 flex-shrink-0"/>
 : <Square size={16} className="text-gray-300
 flex-shrink-0"/>}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200
 p-4 shadow-sm">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-3
 flex items-center gap-2">
 <Bot size={15} className="text-[#C9A84C]"/> SILO Advisor
 </h3>
 <textarea value={advisorMsg}
 onChange={e=>setAdvisorMsg(e.target.value)}
 placeholder="Pergunte qual ferramenta usar..."
 className="w-full text-xs border border-gray-200 rounded-lg p-2
 resize-none focus:ring-1 focus:ring-[#C9A84C] outline-none"
 rows={3}/>
 <button onClick={handleAdvisor}
 className="mt-2 w-full bg-[#1A1A2E] text-white text-xs py-2
 rounded-lg hover:bg-[#2d2d4a] transition-colors
 flex items-center justify-center gap-1">
 <Sparkles size={13}/> Recomendar
 </button>
 {advisorResp && (
 <div className="mt-3 p-2.5 bg-[#F4F1EB] rounded-lg text-xs
 text-gray-700 border border-[#C9A84C]/20 leading-relaxed">
 {advisorResp}
 </div>
 )}
 </div>
 <div className="bg-white rounded-xl border border-gray-200
 p-4 shadow-sm">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-3">
 Selecionadas ({selectedTools.length})
 </h3>
 <div className="space-y-1.5 max-h-44 overflow-y-auto">
 {selectedTools.length===0
 ? <p className="text-xs text-gray-400">Nenhuma</p>
 : selectedTools.map(id => {
 const t = TOOLS.find(x=>x.id===id);
 return t ? (
 <div key={id} className="flex items-center justify-between
 bg-[#C9A84C]/8 rounded-lg px-2.5 py-1.5">
 <span className="text-xs font-medium text-[#0F0F1A]
 truncate">{t.icon} {t.name}</span>
 <button onClick={()=>toggle(id)}>
 <X size={12} className="text-gray-400"/>
 </button>
 </div>
 ) : null;
 })
 }
 </div>
 {selectedTools.length > 0 && (
 <button onClick={()=>setStep('client')}
 className="mt-3 w-full bg-[#C9A84C] text-[#0F0F1A] text-sm
 font-semibold py-2 rounded-lg hover:bg-[#b8942e]">
 Próximo: Cliente →
 </button>
 )}
 </div>
 </div>
 </div>
 )}

 {/* STEP 2 — CLIENTE */}
 {step==='client' && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="bg-white rounded-xl border border-gray-200
 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-3">
 Selecionar Cliente
 </h3>
 <div className="relative">
 <Search size={15} className="absolute left-3 top-1/2
 -translate-y-1/2 text-gray-400"/>
 <input value={clientSearch}
 onChange={e=>setClientSearch(e.target.value)}
 placeholder="Buscar por nome ou CNPJ..."
 className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200
 rounded-lg focus:ring-1 focus:ring-[#C9A84C] outline-none"/>
 </div>
 </div>
 <div className="overflow-y-auto" style={{maxHeight:'360px'}}>
 {filteredClients.map(c => (
 <div key={c.id} onClick={()=>setSelectedClient(c)}
 className={`flex items-center gap-3 px-4 py-3.5 border-b
 border-gray-50 cursor-pointer hover:bg-gray-50 ${
 selectedClient?.id===c.id
 ? 'bg-[#C9A84C]/10 border-l-2 border-[#C9A84C]' : ''}`}>
 <div className="w-9 h-9 bg-[#1A1A2E] rounded-full flex
 items-center justify-center text-[#C9A84C] font-bold
 text-sm flex-shrink-0">
 {c.nome.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-[#0F0F1A] truncate">
 {c.nome}
 </p>
 <p className="text-xs text-gray-400">
 {c.cnpj} • {c.aum} • {c.perfil}
 </p>
 </div>
 {selectedClient?.id===c.id &&
 <Check size={16} className="text-[#C9A84C] flex-shrink-0"/>}
 </div>
 ))}
 </div>
 </div>
 <div className="space-y-4">
 {selectedClient && (
 <div className="bg-white rounded-xl border border-[#C9A84C]/30
 p-4 shadow-sm">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-3
 flex items-center gap-2">
 <User size={15} className="text-[#C9A84C]"/>
 Cliente Selecionado
 </h3>
 <div className="space-y-2 text-xs">
 {[['Nome',selectedClient.nome],['CNPJ',selectedClient.cnpj],
 ['Portfolio',selectedClient.portfolio],
 ['AuM',selectedClient.aum],
 ['E-mail',selectedClient.email],
 ['WhatsApp',selectedClient.telefone],
 ].map(([l,v]) => (
 <div key={l} className="flex justify-between py-1
 border-b border-gray-50">
 <span className="text-gray-400">{l}:</span>
 <span className="font-medium text-gray-700 truncate
 ml-2">{v}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 <div className="bg-white rounded-xl border border-gray-200
 p-4 shadow-sm">
 <h3 className="text-sm font-semibold text-[#0F0F1A] mb-3">
 Configurar Relatório
 </h3>
 <div className="space-y-3">
 <div>
 <label className="text-xs text-gray-500 font-medium">
 Nome
 </label>
 <input value={reportName}
 onChange={e=>setReportName(e.target.value)}
 placeholder={`Relatório ${selectedClient?.nome||''}`}
 className="mt-1 w-full text-sm border border-gray-200
 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#C9A84C]
 outline-none"/>
 </div>
 <div>
 <label className="text-xs text-gray-500 font-medium">
 Período
 </label>
 <div className="mt-1 flex gap-2">
 <input type="date" className="flex-1 text-sm border
 border-gray-200 rounded-lg px-3 py-2 outline-none"/>
 <span className="self-center text-gray-400 text-xs">
 até
 </span>
 <input type="date" className="flex-1 text-sm border
 border-gray-200 rounded-lg px-3 py-2 outline-none"/>
 </div>
 </div>
 </div>
 <button onClick={handleGenerate}
 disabled={!selectedClient||generating}
 className="mt-4 w-full bg-[#C9A84C] text-[#0F0F1A] text-sm
 font-bold py-2.5 rounded-lg hover:bg-[#b8942e]
 disabled:opacity-50 flex items-center justify-center gap-2">
 {generating
 ? <span>■ Gerando com IA...</span>
 : <><Sparkles size={15}/> Gerar com IA</>}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* STEP 3 — PREVIEW */}
 {step==='preview' && (
 <div className="space-y-4">
 <div className="bg-white rounded-xl border border-gray-200 p-4
 shadow-sm flex flex-wrap items-center gap-3 justify-between">
 <div>
 <h3 className="font-semibold text-[#0F0F1A] text-sm">
 {reportName||`Relatório — ${selectedClient?.nome}`}
 </h3>
 <p className="text-xs text-gray-400">
 Gerado por SILO Advisor IA •{selectedTools.length} ferramentas
 </p>
 </div>
 <div className="flex gap-2">
 <button className="flex items-center gap-2 px-3 py-2 text-xs
 font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
 <Eye size={14}/> Preview
 </button>
 <button className="flex items-center gap-2 px-3 py-2 text-xs
 font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
 <Download size={14}/> PDF
 </button>
 <button onClick={()=>setSendModal(true)}
 className="flex items-center gap-2 px-3 py-2 text-xs
 font-bold bg-[#C9A84C] text-[#0F0F1A] rounded-lg">
 <Send size={14}/> Enviar
 </button>
 </div>
 </div>
 <div className="bg-[#0F0F1A] rounded-t-xl px-8 py-6
 flex justify-between items-center">
 <div>
 <p className="text-[#C9A84C] text-[10px] font-bold uppercase
 tracking-widest mb-1">Relatório de Resultados</p>
 <h2 className="text-white text-xl font-bold">
 {selectedClient?.nome||'Cliente'}
 </h2>
 <p className="text-white/50 text-xs mt-1">
 Fevereiro 2026 • {selectedClient?.portfolio}
 </p>
 </div>
 <div className="text-right">
 <p className="text-[#C9A84C] font-bold text-2xl">
 {selectedClient?.aum}
 </p>
 <p className="text-white/50 text-xs">AuM Total</p>
 <p className="text-emerald-400 text-sm font-semibold mt-1">
 +8.2% no período
 </p>
 </div>
 </div>
 <div className="grid grid-cols-4 bg-white border border-t-0
 border-gray-200 divide-x divide-gray-100">
 {[{label:'Retorno Mês',v:'+1.4%',s:'CDI: +1.05%'},
 {label:'Retorno 12m',v:'+8.2%',s:'IBOV: +6.7%'},
 {label:'VaR (95%)',v:'1.1%',s:'Limite: 2.0%'},
 {label:'Sharpe',v:'1.42',s:'Benchmark CDI'},
 ].map(k => (
 <div key={k.label} className="p-4 text-center">
 <p className="text-xs text-gray-400">{k.label}</p>
 <p className="text-lg font-bold text-[#0F0F1A] mt-0.5">
 {k.v}
 </p>
 <p className="text-[10px] text-gray-400 mt-0.5">{k.s}</p>
 </div>
 ))}
 </div>
 <div className="grid grid-cols-2 gap-4 bg-white border
 border-t-0 border-gray-200 p-6 rounded-b-xl">
 {['Evolução Patrimonial 12M','Alocação por Classe',
 'Retorno vs Benchmarks','Exposição ao Risco VaR'].map((t,i) => (
 <div key={i} className="border border-gray-100 rounded-xl
 overflow-hidden">
 <div className="px-4 py-3 border-b border-gray-100 text-xs
 font-semibold text-[#0F0F1A]">{t}</div>
 <div className="h-36 flex items-center justify-center
 bg-gradient-to-br from-gray-50 to-[#F4F1EB]">
 <BarChart2 size={36} className="text-[#C9A84C]/30"/>
 </div>
 </div>
 ))}
 </div>
 <div className="bg-[#F4F1EB] rounded-xl p-4 border
 border-[#C9A84C]/20">
 <h4 className="text-xs font-bold text-[#0F0F1A] mb-2
 flex items-center gap-2">
 <Bot size={14} className="text-[#C9A84C]"/>
 Narrativa Gerada por IA
 </h4>
 <p className="text-xs text-gray-600 leading-relaxed">
 A carteira apresentou performance acima do CDI em todos os
 períodos. Retorno de +8.2% nos últimos 12 meses. O VaR de 1.1%
 (IC 95%) permanece dentro dos limites estabelecidos. Markowitz
 sugere potencial de melhoria no Sharpe com maior exposição IMA-B.
 </p>
 </div>
 </div>
 )}

 {/* Modal Envio */}
 {sendModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center
 justify-center z-50">
 <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
 <h3 className="font-bold text-[#0F0F1A] mb-4 flex items-center gap-2">
 <Send size={18} className="text-[#C9A84C]"/> Enviar Relatório
 </h3>
 <div className="space-y-3">
 {[{label:'■ E-mail', dest:selectedClient?.email||''},
 {label:'■ WhatsApp', dest:selectedClient?.telefone||''},
 ].map((opt,i) => (
 <label key={i} className="flex items-center gap-3 p-3
 bg-gray-50 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="rounded"/>
 <div>
 <p className="text-sm font-medium">{opt.label}</p>
 <p className="text-xs text-gray-400">{opt.dest}</p>
 </div>
 </label>
 ))}
 </div>
 <div className="flex gap-2 mt-5">
 <button onClick={()=>setSendModal(false)}
 className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">
 Cancelar
 </button>
 <button onClick={()=>setSendModal(false)}
 className="flex-1 py-2 bg-[#C9A84C] text-[#0F0F1A] font-bold
 rounded-lg text-sm">
 Confirmar Envio
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
