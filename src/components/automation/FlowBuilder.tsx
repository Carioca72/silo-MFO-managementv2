import { useState } from 'react';
import { Plus, Trash2, Save, Play, Zap, Mail, MessageCircle,
 FileText, Bot, Filter, Clock } from 'lucide-react';

type NodeType = 'trigger_ai'|'trigger_cron'|'trigger_email'|'trigger_wa'|
 'extract_email'|'generate_pdf'|'send_email'|'send_wa'|'condition'|
 'comdinheiro'|'ai_analysis'|'delay';

interface FlowNode { id:string; type:NodeType; label:string; config:Record<string,any>; }

const CATALOG = [
 {type:'trigger_ai' as NodeType, label:'Gatilho IA', icon:Bot,
 color:'bg-purple-100 border-purple-300 text-purple-800', group:'Gatilhos',
 desc:'IA detecta intencao em email ou WhatsApp'},
 {type:'trigger_cron' as NodeType, label:'Agendamento', icon:Clock,
 color:'bg-blue-100 border-blue-300 text-blue-800', group:'Gatilhos',
 desc:'Cron schedule (ex: todo dia 28 as 9h)'},
 {type:'trigger_email' as NodeType, label:'Email Recebido', icon:Mail,
 color:'bg-indigo-100 border-indigo-300 text-indigo-800', group:'Gatilhos',
 desc:'Dispara quando email chega no inbox'},
 {type:'trigger_wa' as NodeType, label:'WA Recebido', icon:MessageCircle,
 color:'bg-green-100 border-green-300 text-green-800', group:'Gatilhos',
 desc:'Dispara quando mensagem WhatsApp chega'},
 {type:'extract_email' as NodeType, label:'Extrair Email IA',icon:Bot,
 color:'bg-amber-100 border-amber-300 text-amber-800', group:'Processamento',
 desc:'IA extrai dados estruturados do email'},
 {type:'comdinheiro' as NodeType, label:'ComDinheiro', icon:FileText,
 color:'bg-teal-100 border-teal-300 text-teal-800', group:'Processamento',
 desc:'Consulta endpoint da API ComDinheiro'},
 {type:'ai_analysis' as NodeType, label:'Analise IA', icon:Bot,
 color:'bg-orange-100 border-orange-300 text-orange-800',group:'Processamento',
 desc:'SILO Advisor analisa dados e gera narrativa'},
 {type:'condition' as NodeType, label:'Condicao', icon:Filter,
 color:'bg-red-100 border-red-300 text-red-800', group:'Logica',
 desc:'Bifurca fluxo (ex: se VaR > 2.5%)'},
 {type:'delay' as NodeType, label:'Aguardar', icon:Clock,
 color:'bg-gray-100 border-gray-300 text-gray-600', group:'Logica',
 desc:'Pausa o fluxo por X minutos'},
 {type:'generate_pdf' as NodeType, label:'Gerar PDF Silo', icon:FileText,
 color:'bg-yellow-50 border-yellow-400 text-yellow-800',group:'Saida',
 desc:'Gera PDF com layout branded Silo'},
 {type:'send_email' as NodeType, label:'Enviar E-mail', icon:Mail,
 color:'bg-blue-100 border-blue-300 text-blue-800', group:'Saida',
 desc:'Envia email com ou sem PDF anexo'},
 {type:'send_wa' as NodeType, label:'Enviar WhatsApp', icon:MessageCircle,
 color:'bg-green-100 border-green-300 text-green-800',group:'Saida',
 desc:'Envia mensagem WhatsApp com link do PDF'},
];

const GROUPS = [...new Set(CATALOG.map(n=>n.group))];

export default function FlowBuilder({onSave}:{onSave:(flow:any)=>void}) {
 const [nome, setNome] = useState('');
 const [cron, setCron] = useState('manual');
 const [nodes, setNodes] = useState<FlowNode[]>([]);
 const [catalog, setCatalog] = useState(false);
 const [configNode, setConfig] = useState<FlowNode|null>(null);
 const [saving, setSaving] = useState(false);

 const addNode = (type:NodeType) => {
 const cat = CATALOG.find(n=>n.type===type);
 setNodes(p=>[...p, {id:'n'+Date.now(), type, label:cat?.label||type, config:{}}]);
 setCatalog(false);
 };

 const removeNode = (id:string) => setNodes(p=>p.filter(n=>n.id!==id));

 const updateCfg = (id:string, k:string, v:any) =>
 setNodes(p=>p.map(n=>n.id===id?{...n,config:{...n.config,[k]:v}}:n));

 const save = async () => {
 if (!nome.trim()) { alert('Nome obrigatorio'); return; }
 if (!nodes.length) { alert('Adicione ao menos 1 no'); return; }
 setSaving(true);
 try {
 const res = await fetch('/api/automation', {
 method:'POST', headers:{'Content-Type':'application/json'},
 body:JSON.stringify({nome, cronExpr:cron, nodes}),
 });
 onSave(await res.json());
 alert('Fluxo salvo: ' + nome);
 setNome(''); setCron('manual'); setNodes([]);
 } catch { alert('Erro ao salvar'); }
 setSaving(false);
 };

 return (
 <div className="space-y-4">
 {/* Config basica */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <h3 className="font-semibold text-sm text-[#0F0F1A] mb-3">Configurar Fluxo</h3>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs text-gray-500">Nome do Fluxo</label>
 <input value={nome} onChange={e=>setNome(e.target.value)}
 placeholder="Ex: Relatorio Automatico Mensal"
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#C9A84C]"/>
 </div>
 <div>
 <label className="text-xs text-gray-500">Schedule (cron ou manual)</label>
 <input value={cron} onChange={e=>setCron(e.target.value)}
 placeholder="0 9 28 * *"
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none font-mono"/>
 </div>
 </div>
 </div>
 {/* Canvas */}
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between">
 <h3 className="font-semibold text-sm text-[#0F0F1A]">Canvas ({nodes.length} nos)</h3>
 <button onClick={()=>setCatalog(true)}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A2E] text-white text-xs rounded-lg">
 <Plus size={13}/> Adicionar No
 </button>
 </div>
 {nodes.length===0 ? (
 <div className="p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 m-4 rounded-xl">
 <Zap size={32} className="text-gray-300 mb-3"/>
 <p className="text-sm text-gray-400 mb-3">Fluxo vazio. Adicione um no de gatilho para comecar.</p>
 <button onClick={()=>setCatalog(true)}
 className="px-4 py-2 bg-[#C9A84C] text-[#0F0F1A] text-sm font-bold rounded-lg">
 + Adicionar Primeiro No
 </button>
 </div>
 ) : (
 <div className="p-4">
 <div className="flex flex-wrap items-center gap-2">
 {nodes.map((node,i) => {
 const cat = CATALOG.find(n=>n.type===node.type);
 const Icon = cat?.icon||Zap;
 return (
 <div key={node.id} className="flex items-center gap-2">
 <div onClick={()=>setConfig(node)}
 className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all ${cat?.color||'bg-gray-100 border-gray-200'}`}>
 <Icon size={14}/>
 <div>
 <p className="text-[11px] font-bold">{node.label}</p>
 {node.config.endpoint&&<p className="text-[9px] opacity-60 font-mono">{node.config.endpoint}</p>}
 </div>
 <button onClick={e=>{e.stopPropagation();removeNode(node.id);}}
 className="ml-1 p-0.5 hover:bg-black/10 rounded">
 <Trash2 size={10}/>
 </button>
 </div>
 {i<nodes.length-1&&<span className="text-gray-400 font-bold">→</span>}
 </div>
 );
 })}
 </div>
 </div>
 )}
 {nodes.length>0&&(
 <div className="p-4 border-t border-gray-100 flex gap-2">
 <button onClick={save} disabled={saving}
 className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#C9A84C] text-[#0F0F1A] text-xs font-bold rounded-lg disabled:opacity-50">
 {saving?'Salvando...':<><Save size={13}/>Salvar Fluxo</>}
 </button>
 </div>
 )}
 </div>
 {/* Catalogo overlay */}
 {catalog&&(
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-white rounded-2xl p-5 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-bold text-[#0F0F1A]">Catalogo de Nos</h3>
 <button onClick={()=>setCatalog(false)} className="p-1 hover:bg-gray-100 rounded-lg">X</button>
 </div>
 {GROUPS.map(group=>(
 <div key={group} className="mb-5">
 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group}</h4>
 <div className="grid grid-cols-3 gap-2">
 {CATALOG.filter(n=>n.group===group).map(n=>(
 <button key={n.type} onClick={()=>addNode(n.type)}
 className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left hover:shadow-md ${n.color}`}>
 <n.icon size={14} className="flex-shrink-0 mt-0.5"/>
 <div>
 <p className="text-[11px] font-bold">{n.label}</p>
 <p className="text-[10px] opacity-60 leading-tight">{n.desc}</p>
 </div>
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 {/* Config do no */}
 {configNode&&(
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl">
 <h3 className="font-bold text-[#0F0F1A] mb-4">Configurar: {configNode.label}</h3>
 <div className="space-y-3">
 {configNode.type==='comdinheiro'&&(
 <div>
 <label className="text-xs text-gray-500">Endpoint ComDinheiro</label>
 <select value={configNode.config.endpoint||''}
 onChange={e=>updateCfg(configNode.id,'endpoint',e.target.value)}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none">
 <option value=''>Selecionar...</option>
 {['ExtratoCarteira022','Value_at_Risk001','Markowitz001',
 'PosicaoConsolidada001','AnaliseEstilo001','Duration001',
 'StressTest001','DrawDownAcumulado001'].map(ep=>(
 <option key={ep} value={ep}>{ep}</option>
 ))}
 </select>
 </div>
 )}
 {(configNode.type==='send_email'||configNode.type==='send_wa')&&(
 <>
 <div>
 <label className="text-xs text-gray-500">Destinatario</label>
 <input value={configNode.config.to||''}
 onChange={e=>updateCfg(configNode.id,'to',e.target.value)}
 placeholder={configNode.type==='send_email'?'email@empresa.com':'5581999990001'}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"/>
 </div>
 <div>
 <label className="text-xs text-gray-500">Mensagem</label>
 <textarea value={configNode.config.message||''}
 onChange={e=>updateCfg(configNode.id,'message',e.target.value)}
 rows={3} placeholder="Segue seu relatorio..."
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none"/>
 </div>
 <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
 <input type="checkbox" checked={configNode.config.attachPDF||false}
 onChange={e=>updateCfg(configNode.id,'attachPDF',e.target.checked)}/>
 Anexar PDF gerado automaticamente
 </label>
 </>
 )}
 {configNode.type==='condition'&&(
 <div className="flex gap-2">
 <input value={configNode.config.field||''}
 onChange={e=>updateCfg(configNode.id,'field',e.target.value)}
 placeholder="campo ex: var_95"
 className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none font-mono"/>
 <select value={configNode.config.operator||'>'}
 onChange={e=>updateCfg(configNode.id,'operator',e.target.value)}
 className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none">
 {['>','<','>=','<=','=='].map(op=><option key={op}>{op}</option>)}
 </select>
 <input type="number" value={configNode.config.value||''}
 onChange={e=>updateCfg(configNode.id,'value',parseFloat(e.target.value))}
 placeholder="2.5" className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"/>
 </div>
 )}
 {configNode.type==='trigger_cron'&&(
 <div>
 <label className="text-xs text-gray-500">Cron Expression</label>
 <input value={configNode.config.cron||''}
 onChange={e=>updateCfg(configNode.id,'cron',e.target.value)}
 placeholder="0 9 28 * *" className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none font-mono"/>
 </div>
 )}
 {configNode.type==='delay'&&(
 <div>
 <label className="text-xs text-gray-500">Aguardar (minutos)</label>
 <input type="number" value={configNode.config.minutes||5}
 onChange={e=>updateCfg(configNode.id,'minutes',parseInt(e.target.value))}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"/>
 </div>
 )}
 {configNode.type==='trigger_ai'&&(
 <div>
 <label className="text-xs text-gray-500">Confianca minima IA (0.0 a 1.0)</label>
 <input type="number" min={0} max={1} step={0.1}
 value={configNode.config.minConfidence||0.7}
 onChange={e=>updateCfg(configNode.id,'minConfidence',parseFloat(e.target.value))}
 className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"/>
 </div>
 )}
 </div>
 <div className="flex gap-2 mt-5">
 <button onClick={()=>setConfig(null)}
 className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
 <button onClick={()=>setConfig(null)}
 className="flex-1 py-2 bg-[#C9A84C] text-[#0F0F1A] font-bold rounded-lg text-sm">Salvar Config</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
