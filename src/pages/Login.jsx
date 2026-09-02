import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';
import AlertBanner from '../components/ui/alertbanner';

export default function Login() {
  const { loginWithAzure } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setMensajeFeedback(null);
      await loginWithAzure();
    } catch (error) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Error al iniciar sesión con Microsoft: ' + (error.message || 'Intente nuevamente.'),
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Elemento decorativo de fondo para dar efecto moderno de iluminación */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8 border border-slate-100 relative z-10">
        
        {/* Logo e información de cabecera */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-50 flex items-center justify-center p-1">
            <img 
              src="/logo_ricciardi.jpeg" 
              alt="ATS Ricciardi Logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">ATS Ricciardi</h1>
            <p className="text-sm text-slate-500">Portal de Reclutamiento y Selección</p>
          </div>
        </div>

        {/* Alerta de Feedback si ocurre algún error en el inicio de sesión */}
        <AlertBanner
          tipo={mensajeFeedback?.tipo}
          texto={mensajeFeedback?.texto}
          onClose={() => setMensajeFeedback(null)}
        />

        {/* Botón de Inicio de Sesión con Microsoft / Azure */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Conectando con Microsoft...</span>
              </>
            ) : (
              <>
                {/* Icono corporativo de Microsoft (SVG limpio) */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                <span>Iniciar sesión con Microsoft</span>
              </>
            )}
          </button>
        </div>

        {/* Pie de tarjeta con nota de seguridad */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Acceso restringido al personal autorizado</span>
        </div>

      </div>
    </div>
  );
}