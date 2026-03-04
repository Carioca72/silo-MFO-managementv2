import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { StatCard } from './StatCard';
import { AlertFeed } from './AlertFeed';
import { socket } from '../../services/api';

const MOCK_DATA = [
  { name: 'Jan', aum: 4000 },
  { name: 'Fev', aum: 4200 },
  { name: 'Mar', aum: 4100 },
  { name: 'Abr', aum: 4400 },
  { name: 'Mai', aum: 4600 },
  { name: 'Jun', aum: 4800 },
];

interface Alert {
  id: string;
  message: string;
  time: string;
  severity: 'high' | 'medium' | 'low' | 'success';
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Função para lidar com a recepção de novos alertas
    const handleNewAlert = (newAlert: Alert) => {
      setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
    };

    // Se inscrever no evento 'new_alert'
    socket.on('new_alert', handleNewAlert);

    // Limpeza: se desinscrever do evento quando o componente for desmontado
    return () => {
      socket.off('new_alert', handleNewAlert);
    };
  }, []); // O array de dependências vazio garante que isso rode apenas uma vez

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Clientes" value="124" trend="+12%" />
        <StatCard title="Relatórios Enviados" value="89" trend="+5%" />
        <StatCard title="AuM Total" value="R$ 450M" trend="+8%" />
        <StatCard title="VaR Médio" value="1.2%" trend="-0.1%" isRisk />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-[#1A1A2E]">Evolução Patrimonial Agregada</h3>
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-[#C9A84C] focus:ring focus:ring-[#C9A84C] focus:ring-opacity-50">
              <option>Últimos 6 meses</option>
              <option>Ano atual</option>
              <option>12 meses</option>
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorAum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1A1A2E', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="aum" stroke="#C9A84C" strokeWidth={2} fillOpacity={1} fill="url(#colorAum)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Feed */}
        <AlertFeed alerts={alerts} />
      </div>
    </div>
  );
}
