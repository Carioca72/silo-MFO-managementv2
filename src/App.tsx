import React, { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutDashboard, Wrench, MessageSquare, Menu, FileText, Users, Mail, MessageCircle, Zap, PieChart, History } from 'lucide-react';
import { LoadingSkeleton } from './components/ui/LoadingSkeleton';

import { CRMUpdates } from './components/crm/CRMUpdates';

// Lazy load components
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));
const ReportGenerator = React.lazy(() => import('./components/reports/ReportGenerator'));
const StudyGenerator = React.lazy(() => import('./components/reports/StudyGenerator'));
const ReportHistory = React.lazy(() => import('./components/reports/ReportHistory'));
const ClientManager = React.lazy(() => import('./components/clients/ClientManager'));
const WhatsAppManager = React.lazy(() => import('./components/whatsapp/WhatsAppManager'));
const EmailManager = React.lazy(() => import('./components/email/EmailManager'));
const AutomationFlow = React.lazy(() => import('./components/automation/AutomationFlow'));
const AdvisorPage = React.lazy(() => import('./components/advisor/AdvisorPage'));
const ToolsCatalog = React.lazy(() => import('./components/ToolsCatalog').then(module => ({ default: module.ToolsCatalog })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } }
});

const TAB_COMPONENTS: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  tools: ToolsCatalog,
  advisor: AdvisorPage,
  'report-gen': ReportGenerator,
  'report-study': StudyGenerator,
  'report-history': ReportHistory,
  clients: ClientManager,
  whatsapp: WhatsAppManager,
  email: EmailManager,
  automation: AutomationFlow,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('advisor');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-[#F4F1EB]" style={{ contain: 'layout' }}>
        {/* Sidebar */}
        <div 
          className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1A1A2E] text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-700 h-16">
            {sidebarOpen && <h1 className="font-bold text-xl tracking-wider text-[#C9A84C]">SILO MFO</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
              <Menu size={20} />
            </button>
          </div>
          
          <nav className="flex-1 py-6 space-y-1 px-2 overflow-y-auto">
            <NavGroup label="Visão Geral" expanded={sidebarOpen}>
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" expanded={sidebarOpen} />
              <NavButton active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users size={20} />} label="Clientes" expanded={sidebarOpen} />
            </NavGroup>

            <NavGroup label="Inteligência" expanded={sidebarOpen}>
              <NavButton active={activeTab === 'advisor'} onClick={() => setActiveTab('advisor')} icon={<MessageSquare size={20} />} label="SILO Advisor" expanded={sidebarOpen} />
              <NavButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={<Wrench size={20} />} label="Ferramentas" expanded={sidebarOpen} />
            </NavGroup>

            <NavGroup label="Relatórios" expanded={sidebarOpen}>
              <NavButton active={activeTab === 'report-gen'} onClick={() => setActiveTab('report-gen')} icon={<FileText size={20} />} label="Gerar Relatório" expanded={sidebarOpen} />
              <NavButton active={activeTab === 'report-study'} onClick={() => setActiveTab('report-study')} icon={<PieChart size={20} />} label="Estudo Carteira" expanded={sidebarOpen} />
              <NavButton active={activeTab === 'report-history'} onClick={() => setActiveTab('report-history')} icon={<History size={20} />} label="Histórico" expanded={sidebarOpen} />
            </NavGroup>

            <NavGroup label="Envio & Automação" expanded={sidebarOpen}>
              <NavButton active={activeTab === 'automation'} onClick={() => setActiveTab('automation')} icon={<Zap size={20} />} label="Automações" expanded={sidebarOpen} />
              <NavButton active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} icon={<MessageCircle size={20} />} label="WhatsApp" expanded={sidebarOpen} />
              <NavButton active={activeTab === 'email'} onClick={() => setActiveTab('email')} icon={<Mail size={20} />} label="E-mail" expanded={sidebarOpen} />
            </NavGroup>
          </nav>

          <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
            {sidebarOpen && <p>Versão 2.0 • Fev 2026</p>}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <CRMUpdates />
          <header className="bg-white shadow-sm px-6 h-16 flex justify-between items-center z-10 shrink-0">
            <h2 className="text-xl font-semibold text-[#1A1A2E]">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'tools' && 'Gestão de Ferramentas'}
              {activeTab === 'advisor' && 'Assistente Inteligente'}
              {activeTab === 'clients' && 'Gestão de Clientes'}
              {activeTab === 'report-gen' && 'Gerador de Relatórios'}
              {activeTab === 'report-study' && 'Estudo de Carteira'}
              {activeTab === 'report-history' && 'Histórico de Relatórios'}
              {activeTab === 'automation' && 'Automação de Fluxos'}
              {activeTab === 'whatsapp' && 'Sessões WhatsApp'}
              {activeTab === 'email' && 'Gestão de E-mail'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Analista Sênior</p>
                <p className="text-xs text-gray-500">lco.invest</p>
              </div>
              <div className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                AS
              </div>
            </div>
          </header>

          <main 
            className="flex-1 overflow-auto p-6 bg-[#F4F1EB]"
            style={{ height: 'calc(100vh - 64px)', willChange: 'scroll-position' }}
          >
            <Suspense fallback={<LoadingSkeleton />}>
              {TAB_COMPONENTS[activeTab] ? React.createElement(TAB_COMPONENTS[activeTab]) : <div className="text-center p-10 text-gray-500">Componente não encontrado</div>}
            </Suspense>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

function NavGroup({ label, children, expanded }: { label: string, children: React.ReactNode, expanded: boolean }) {
  return (
    <div className="mb-4">
      {expanded && <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</h3>}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, expanded }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all mx-auto ${
        active 
          ? 'bg-[#C9A84C] text-[#1A1A2E] font-medium shadow-md' 
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      } ${expanded ? 'justify-start' : 'justify-center'}`}
      title={!expanded ? label : undefined}
    >
      <div className={`${active ? 'text-[#1A1A2E]' : 'text-[#C9A84C]'}`}>{icon}</div>
      <span 
        style={{
          opacity: expanded ? 1 : 0,
          width: expanded ? 'auto' : '0px',
          overflow: 'hidden',
          transition: 'opacity 200ms, width 200ms',
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </span>
    </button>
  );
}


