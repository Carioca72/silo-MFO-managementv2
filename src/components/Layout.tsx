import { NavLink, Outlet } from "react-router-dom";
import { BotMessageSquare, BarChart, Settings, LifeBuoy } from "lucide-react";

const Sidebar = () => (
  <aside className="w-64 flex-shrink-0 bg-background border-r border-border p-4 flex flex-col justify-between">
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-silo-gold">SILO</h1>
        <p className="text-sm text-muted-foreground">ADVISOR</p>
      </div>
      <nav className="flex flex-col space-y-2">
        <SidebarLink to="/" icon={<BotMessageSquare size={20} />}>Advisor</SidebarLink>
        <SidebarLink to="/whatsapp" icon={<BarChart size={20} />}>WhatsApp</SidebarLink>
        {/* Adicionar outros links aqui no futuro */}
      </nav>
    </div>
    <div className="flex flex-col space-y-2">
        <SidebarLink to="/settings" icon={<Settings size={20} />}>Configurações</SidebarLink>
        <SidebarLink to="/help" icon={<LifeBuoy size={20} />}>Ajuda</SidebarLink>
    </div>
  </aside>
);

const SidebarLink = ({ to, icon, children }) => {
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
