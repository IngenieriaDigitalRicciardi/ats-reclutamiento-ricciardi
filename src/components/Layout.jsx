import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  Users, 
  Briefcase, 
  FolderKanban, 
  UserCheck, 
  Building2,
  LogOut 
} from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();

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

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        
        {/* Logo superior alineado verticalmente (Imagen arriba) */}
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
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Botón de Logout en el Sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Superior con Icono Dinámico */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-blue-600 rounded-lg">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold capitalize text-slate-800">
              {currentItem.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {userInitial}
              </div>
              <span className="text-sm font-medium text-slate-700">{userName}</span>
            </div>
            
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}