import { NavLink, Outlet } from "react-router-dom";
import { 
  BotMessageSquare, 
  BarChart, 
  Settings, 
  LifeBuoy, 
  Users, 
  LayoutDashboard, 
  Zap, 
  FileText, 
  BarChart3 
} from "lucide-react";

const Sidebar = () => (
  <aside className="w-64 flex-shrink-0 bg-background border-r border-border p-4 flex flex-col justify-between">
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-silo-gold">SILO</h1>
        <p className="text-sm text-muted-foreground">ADVISOR</p>
      </div>
      <nav className="flex flex-col space-y-2">
        <SidebarLink to="/" icon={<BotMessageSquare size={20} />}>Advisor</SidebarLink>
        <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />}>Dashboards</SidebarLink>
        <SidebarLink to="/crm" icon={<Users size={20} />}>CRM</SidebarLink>
        <SidebarLink to="/automation" icon={<Zap size={20} />}>Automação</SidebarLink>
        <SidebarLink to="/studies" icon={<FileText size={20} />}>Estudo de Carteira</SidebarLink>
        <SidebarLink to="/reports" icon={<BarChart3 size={20} />}>Relatórios</SidebarLink>
        <SidebarLink to="/whatsapp" icon={<BarChart size={20} />}>WhatsApp</SidebarLink>
      </nav>
    </div>
    <div className="flex flex-col space-y-2">
        <SidebarLink to="/settings" icon={<Settings size={20} />}>Configurações</SidebarLink>
        <SidebarLink to="/help" icon={<LifeBuoy size={20} />}>Ajuda</SidebarLink>
    </div>
  </aside>
);

const SidebarLink = ({ to, icon, children }: { to: string, icon: React.ReactNode, children: React.ReactNode }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium 
        ${isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
};

export default function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
