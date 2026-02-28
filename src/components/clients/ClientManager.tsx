import { useState, useEffect } from 'react';
import { Search, RefreshCw, Users, ChevronRight, X, Mail, Phone } from 'lucide-react';
import { io } from 'socket.io-client';

interface Client {
  id: string;
  nome: string;
  cnpj: string;
  portfolio: string;
  email: string;
  telefone: string;
  aum: string;
  retorno: string;
  status: string;
  perfil: string;
  sincronizado: boolean;
  stage?: string;
}

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    const socket = io('/', { path: '/socket.io' });
    
    socket.on('crm:stage_change', (data: any) => {
      console.log('ClientManager received update:', data);
      // Refresh list or update specific client
      if (data.client) {
        setClients(prev => prev.map(c => c.id === data.clientId ? data.client : c));
        // Also update selected if it matches
        if (selected?.id === data.clientId) {
          setSelected(data.client);
        }
      } else {
        fetchClients();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selected]);

  const filtered = clients.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search)
  );

  const handleSync = async () => {
    setSyncing(true);
    await fetch('/api/clients/sync', { method: 'POST' }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    await fetchClients();
    setSyncing(false);
    alert('■ Clientes sincronizados do DataCrazy!');
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando clientes...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar clientes..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#C9A84C] outline-none" 
              />
            </div>
            <button 
              onClick={handleSync} 
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-70"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin text-[#C9A84C]' : 'text-gray-500'} />
              {syncing ? 'Sincronizando...' : 'Sync DataCrazy'}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            <Users size={12} className="inline mr-1" />
            {filtered.length} clientes
          </p>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
          {filtered.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelected(c)}
              className={`flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${selected?.id === c.id ? 'bg-[#C9A84C]/5 border-l-2 border-[#C9A84C]' : ''}`}
            >
              <div className="w-10 h-10 bg-[#1A1A2E] rounded-full flex items-center justify-center text-[#C9A84C] font-bold flex-shrink-0">
                {c.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#0F0F1A] truncate">
                    {c.nome}
                  </p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    c.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' :
                    c.status === 'alerta' ? 'bg-amber-100 text-amber-700' :
                    c.status === 'risco' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700' // Default for other stages
                  }`}>
                    {c.status.toUpperCase()}
                  </span>
                  {!c.sincronizado && (
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Não sync</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {c.cnpj} • {c.email}
                </p>
              </div>
              <div className="text-right hidden sm:block flex-shrink-0">
                <p className="text-sm font-bold text-[#0F0F1A]">{c.aum}</p>
                <p className={`text-xs font-semibold ${c.retorno.startsWith('-') ? 'text-red-500' : 'text-emerald-600'}`}>
                  {c.retorno} 12m
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div>
        {selected ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#1A1A2E] rounded-full flex items-center justify-center text-[#C9A84C] font-bold">
                  {selected.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F0F1A]">
                    {selected.nome}
                  </p>
                  <p className="text-[10px] text-gray-400">{selected.perfil}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}>
                <X size={16} className="text-gray-300" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['CNPJ', selected.cnpj],
                ['Portfolio', selected.portfolio],
                ['AuM', selected.aum],
                ['Retorno 12m', selected.retorno],
                ['E-mail', selected.email],
                ['Telefone', selected.telefone],
                ['Stage CRM', selected.stage || 'N/A']
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-medium text-gray-700 truncate ml-2">
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-200 rounded-lg">
                <Mail size={13} /> E-mail
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-200 rounded-lg">
                <Phone size={13} /> WhatsApp
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 flex items-center justify-center text-center">
            <div>
              <Users size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Selecione um cliente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
