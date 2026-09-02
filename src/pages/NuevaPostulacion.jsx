import React, { useState, useEffect } from 'react';
import { getBusquedas } from '../lib/api/busquedas';
import { crearPostulacion } from '../lib/api/postulaciones';
import { supabase } from '../lib/supabaseClient';
import { validarPostulacion } from '../utils/validaciones';
import AlertBanner from '../components/ui/alertbanner';
import { UserPlus, Link as LinkIcon, Phone, Search, Briefcase, Loader2, ArrowLeft, User, ExternalLink, Check } from 'lucide-react';

export default function NuevaPostulacion({ onVolver }) {
  const [busquedas, setBusquedas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  // Estados para la selección y filtrado de candidatos en tabla
  const [textoBusquedaCandidato, setTextoBusquedaCandidato] = useState('');
  const [candidatosDisponibles, setCandidatosDisponibles] = useState([]);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);

  // Estados para la búsqueda laboral
  const [textoBusquedaLaboral, setTextoBusquedaLaboral] = useState('');
  const [idBusqueda, setIdBusqueda] = useState('');
  const [busquedaSeleccionadaObj, setBusquedaSeleccionadaObj] = useState(null);

  // Cargar búsquedas abiertas y precargar candidatos iniciales al iniciar
  useEffect(() => {
    async function inicializarDatos() {
      try {
        const dataBusquedas = await getBusquedas();
        const abiertas = (dataBusquedas || []).filter(b => b.estado === 'Abierta');
        setBusquedas(abiertas);

        cargarCandidatos('');
      } catch (error) {
        setMensajeFeedback({ tipo: 'error', texto: 'Error al cargar los datos iniciales.' });
      }
    }
    inicializarDatos();
  }, []);

  // Función para buscar/filtrar candidatos para la tabla
  const cargarCandidatos = async (filtro = '') => {
    try {
      setCargandoCandidatos(true);
      const queryText = filtro.trim();

      // Obtener IDs de candidatos ya ingresados para excluirlos
      const { data: ingresosData, error: errorIngresos } = await supabase
        .from('ingreso')
        .select('postulacion(id_candidato)');

      if (errorIngresos) throw errorIngresos;

      const idsCandidatosIngresados = ingresosData
        ?.map(i => i.postulacion?.id_candidato)
        .filter(Boolean) || [];

      let supabaseQuery = supabase
        .from('candidato')
        .select('*')
        .limit(20);

      if (queryText.length > 0) {
        supabaseQuery = supabaseQuery.or(`nombre.ilike.%${queryText}%,apellido.ilike.%${queryText}%,telefono.ilike.%${queryText}%`);
      }

      if (idsCandidatosIngresados.length > 0) {
        const idsString = `(${idsCandidatosIngresados.join(',')})`;
        supabaseQuery = supabaseQuery.not('id', 'in', idsString);
      }

      const { data, error } = await supabaseQuery;
      if (error) throw error;

      setCandidatosDisponibles(data || []);
    } catch (error) {
      console.error('Error cargando candidatos:', error);
    } finally {
      setCargandoCandidatos(false);
    }
  };

  // Efecto para filtrar candidatos con debounce al escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarCandidatos(textoBusquedaCandidato);
    }, 300);
    return () => clearTimeout(timer);
  }, [textoBusquedaCandidato]);

  // Filtrar la lista de búsquedas laborales según el texto ingresado
  const busquedasFiltradas = busquedas.filter(b => {
    const texto = textoBusquedaLaboral.toLowerCase();
    const puesto = b.puesto?.nombre?.toLowerCase() || '';
    const empresa = b.empresa?.nombre?.toLowerCase() || '';
    const sucursal = b.sucursal?.nombre?.toLowerCase() || '';
    return puesto.includes(texto) || empresa.includes(texto) || sucursal.includes(texto);
  });

  // Manejar el envío de la postulación
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeFeedback(null);

    try {
      setLoading(true);

      const idBusquedaNum = idBusqueda ? Number(idBusqueda) : null;
      const idCandidatoNum = candidatoSeleccionado ? Number(candidatoSeleccionado.id) : null;

      const resultadoValidacion = await validarPostulacion({
        idCandidato: idCandidatoNum,
        idBusqueda: idBusquedaNum
      });

      if (!resultadoValidacion.esValido) {
        const primerError = Object.values(resultadoValidacion.errores)[0];
        setMensajeFeedback({ tipo: 'error', texto: primerError });
        setLoading(false);
        return;
      }

      await crearPostulacion(idBusquedaNum, idCandidatoNum, null);

      setMensajeFeedback({ tipo: 'success', texto: '¡Postulación registrada con éxito!' });
      
      setTimeout(() => {
        onVolver();
      }, 1500);

    } catch (error) {
      if (error.message && error.message.includes('unique_candidato_busqueda')) {
        setMensajeFeedback({ 
          tipo: 'error', 
          texto: 'Este candidato ya se encuentra postulado a esta búsqueda laboral.' 
        });
      } else {
        setMensajeFeedback({ 
          tipo: 'error', 
          texto: 'Error al registrar la postulación: ' + error.message 
        });
      }
      setLoading(false);
    } finally {
      if (!mensajeFeedback || mensajeFeedback.tipo !== 'success') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Cabecera y botón volver */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onVolver}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva Postulación</h1>
          <p className="text-sm text-slate-500">Selecciona un candidato de la tabla y asígnalo a una búsqueda activa.</p>
        </div>
      </div>

      <AlertBanner 
        tipo={mensajeFeedback?.tipo} 
        texto={mensajeFeedback?.texto} 
        onClose={() => setMensajeFeedback(null)} 
      />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* SECCIÓN 1: Mini Tabla Interactiva de Candidatos */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            1. Seleccionar Candidato
          </h3>

          {candidatoSeleccionado ? (
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <span>{candidatoSeleccionado.nombre} {candidatoSeleccionado.apellido || ''}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Seleccionado</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {candidatoSeleccionado.telefono}</span>
                  {candidatoSeleccionado.cv_url && (
                    <a 
                      href={candidatoSeleccionado.cv_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Ver CV <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCandidatoSeleccionado(null)}
                className="text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-200"
              >
                Cambiar candidato
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre, apellido o teléfono..."
                  value={textoBusquedaCandidato}
                  onChange={(e) => setTextoBusquedaCandidato(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {cargandoCandidatos && (
                  <Loader2 className="absolute right-3 top-3 w-4 h-4 text-blue-600 animate-spin" />
                )}
              </div>

              {/* Contenedor de la mini tabla */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Candidato</th>
                      <th className="p-3">Teléfono</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {candidatosDisponibles.length > 0 ? (
                      candidatosDisponibles.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/85 transition-colors">
                          <td className="p-3 font-medium text-slate-800">
                            {c.nombre} {c.apellido || ''}
                          </td>
                          <td className="p-3 text-slate-600 text-xs">{c.telefono || 'Sin teléfono'}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setCandidatoSeleccionado(c)}
                              className="px-3 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-medium rounded-lg transition-colors"
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-4 text-center text-xs text-slate-500">
                          {cargandoCandidatos ? 'Cargando candidatos...' : 'No se encontraron candidatos.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* SECCIÓN 2: Lista Interactiva de Búsquedas Laborales */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            2. Seleccionar Búsqueda Laboral
          </h3>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por puesto, empresa o sucursal..."
                value={textoBusquedaLaboral}
                onChange={(e) => setTextoBusquedaLaboral(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100 bg-white">
              {busquedasFiltradas.length > 0 ? (
                busquedasFiltradas.map((b) => {
                  const isSelected = String(idBusqueda) === String(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setIdBusqueda(b.id);
                        setBusquedaSeleccionadaObj(b);
                      }}
                      className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className={`text-sm ${isSelected ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'}`}>
                          {b.puesto?.nombre}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Empresa: {b.empresa?.nombre}</span>
                          <span>•</span>
                          <span>Sucursal: {b.sucursal?.nombre}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="bg-blue-600 text-white p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No se encontraron búsquedas activas con ese criterio.
                </div>
              )}
            </div>
            
            {busquedaSeleccionadaObj && (
              <div className="text-xs text-blue-700 font-medium bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex items-center justify-between">
                <span>Seleccionado: <strong>{busquedaSeleccionadaObj.puesto?.nombre}</strong> ({busquedaSeleccionadaObj.empresa?.nombre})</span>
                <button 
                  type="button" 
                  onClick={() => { setIdBusqueda(''); setBusquedaSeleccionadaObj(null); }}
                  className="text-slate-500 hover:text-red-600 underline text-xs"
                >
                  Quitar selección
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onVolver}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !candidatoSeleccionado || !idBusqueda}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Vincular Postulación
          </button>
        </div>

      </form>
    </div>
  );
}