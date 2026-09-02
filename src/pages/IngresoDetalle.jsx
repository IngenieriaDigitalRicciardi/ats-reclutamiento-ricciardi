import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getIngresoById } from '../lib/api/ingresos';
import AlertBanner from '../components/ui/alertbanner';
import { ArrowLeft, Calendar, Mail, Phone, MapPin, Briefcase, Building2, Link as LinkIcon, ExternalLink, FileText, Loader2, ArrowUpRight, Edit3, Save, X } from 'lucide-react';

export default function IngresoDetalle({ ingresoId, onVolver, onVerBusqueda }) {
  const [ingreso, setIngreso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  const [formData, setFormData] = useState({
    fecha_ingreso: '',
    observaciones: '',
  });

  useEffect(() => {
    cargarDetalle();
  }, [ingresoId]);

  async function cargarDetalle() {
    try {
      setLoading(true);
      const data = await getIngresoById(ingresoId);
      setIngreso(data);
      if (data) {
        setFormData({
          fecha_ingreso: data.fecha_ingreso || '',
          observaciones: data.observaciones || '',
        });
      }
    } catch (error) {
      console.error('Error cargando detalle de ingreso:', error);
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Error al cargar el detalle del ingreso: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase
        .from('ingresos') // Ajusta el nombre de la tabla en tu base de datos si es diferente (ej. 'ingreso')
        .update({
          fecha_ingreso: formData.fecha_ingreso,
          observaciones: formData.observaciones,
          updated_at: new Date(),
        })
        .eq('id', ingresoId);

      if (error) throw error;

      setMensajeFeedback({
        tipo: 'success',
        texto: 'Ingreso actualizado con éxito.',
      });
      setModoEdicion(false);
      cargarDetalle();
    } catch (error) {
      setMensajeFeedback({
        tipo: 'error',
        texto: 'Error al actualizar el ingreso: ' + error.message,
      });
      setLoading(false);
    }
  };

  if (loading && !ingreso) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Cargando detalle del ingreso...</span>
      </div>
    );
  }

  if (!ingreso) return <div className="p-6 text-slate-500">No se encontró el registro de ingreso.</div>;

  const candidato = ingreso.postulaciones?.candidatos;
  const puesto = ingreso.postulaciones?.puestos;
  const vacante = ingreso.postulaciones?.vacantes;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado de ingresos
        </button>

        {!modoEdicion && (
          <button
            onClick={() => setModoEdicion(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <Edit3 className="w-4 h-4 text-emerald-600" /> Editar Ingreso
          </button>
        )}
      </div>

      <AlertBanner
        tipo={mensajeFeedback?.tipo}
        texto={mensajeFeedback?.texto}
        onClose={() => setMensajeFeedback(null)}
      />

      {/* Tarjeta Principal */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-lg font-semibold border border-emerald-100">
              Ingreso Confirmado
            </span>
            <h1 className="text-2xl font-bold text-slate-800 mt-2">
              {candidato?.nombre} {candidato?.apellido}
            </h1>
            <p className="text-xs text-slate-400">Registrado en sistema el {new Date(ingreso.created_at).toLocaleDateString()}</p>
          </div>

          {candidato?.cv_url && (
            <a 
              href={candidato.cv_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 self-start"
            >
              <LinkIcon className="w-4 h-4" /> Ver CV Original <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {modoEdicion ? (
          /* Formulario de Edición */
          <form onSubmit={handleGuardar} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <Edit3 className="w-4 h-4 text-emerald-600" /> Modificar Datos del Ingreso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Incorporación <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha_ingreso"
                  value={formData.fecha_ingreso}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Puesto Ocupado (Informativo)
                </label>
                <input
                  type="text"
                  value={puesto?.nombre || '—'}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observaciones de contratación
              </label>
              <textarea
                name="observaciones"
                rows="3"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Notas adicionales sobre la contratación..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModoEdicion(false);
                  setFormData({
                    fecha_ingreso: ingreso.fecha_ingreso || '',
                    observaciones: ingreso.observaciones || '',
                  });
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        ) : (
          /* Vista Normal */
          <>
            {/* Bloque de Información de Puesto y Vacante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Puesto Ocupado</span>
                <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-4 h-4 text-blue-600" /> {puesto?.nombre || '—'}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Fecha de Incorporación</span>
                <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-emerald-600" /> {ingreso.fecha_ingreso ? new Date(ingreso.fecha_ingreso + 'T00:00:00').toLocaleDateString() : '—'}
                </div>
              </div>
            </div>

            {/* 🔍 BLOQUE DE TRAZABILIDAD: Empresa, Sucursal y Acceso a la Búsqueda */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Trazabilidad de la Búsqueda</span>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" /> {vacante?.empresa?.nombre || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> {vacante?.sucursal?.nombre || '—'}
                  </span>
                </div>
              </div>

              {vacante?.id && onVerBusqueda && (
                <button
                  onClick={() => onVerBusqueda(vacante.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 shadow-sm transition-colors self-start sm:self-center"
                >
                  Ver Búsqueda Asociada <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Datos de Contacto y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-2">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{candidato?.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{candidato?.email || 'Sin correo'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{candidato?.ciudad || 'Sin ciudad'}</span>
              </div>
            </div>

            {/* Observaciones del Ingreso */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> Observaciones de contratación
              </h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                {ingreso.observaciones || 'No se registraron observaciones adicionales para este ingreso.'}
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}