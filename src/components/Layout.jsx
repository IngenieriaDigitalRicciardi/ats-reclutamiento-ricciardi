import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  Users, 
  Briefcase, 
  FolderKanban, 
  UserCheck, 
  Building2,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FolderKanban },
    { id: 'vacantes', label: 'Busquedas', icon: Briefcase },
    { id: 'candidatos', label: 'Candidatos', icon: Users },
    { id: 'postulaciones', label: 'Postulaciones', icon: UserCheck },
    { id: 'catalogos', label: 'Estructura Organizacional', icon: Building2 },
    { id: 'ingresos', label: 'Ingresos', icon: UserCheck }
  ];

  const currentItem = menuItems.find(item => item.id === currentTab) || menuItems[0];
  const CurrentIcon = currentItem.icon;

  const userInitial = user?.email ? user.email[0].toUpperCase() : 'U';
  const userName = user?.user_metadata?.full_name || user?.email || 'Usuario ATS';

  const handleNavClick = (id) => {
    setCurrentTab(id);
    setSidebarOpen(false); // Cierra el menú en mobile al hacer clic
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* OVERLAY PARA MOBILE CUANDO EL SIDEBAR ESTÁ ABIERTO */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR RESPONSIVE (Drawer en móvil, fijo en desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Botón cerrar para mobile dentro del sidebar */}
        <div className="absolute top-4 right-4 lg:hidden">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo superior alineado verticalmente */}
        <div className="p-6 border-b border-slate-800 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
            <img 
              src="/logo_ricciardi.jpeg" 
              alt="Logo ATS Ricciardi" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-white">ATS Ricciardi</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Portal de Reclutamiento</p>
          </div>
        </div>

        {/* Menú de navegación lateral */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Botón de Logout en el Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3 truncate">
            {/* Botón menú hamburguesa para mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="p-2 bg-slate-100 text-blue-600 rounded-lg shrink-0 hidden sm:flex">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold capitalize text-slate-800 truncate">
              {currentItem.label}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {userInitial}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden md:inline truncate max-w-[160px]">
                {userName}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}