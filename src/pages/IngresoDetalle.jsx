import React, { useState, useEffect } from 'react'
import { getIngresoById } from '../lib/api/ingresos'
import { ArrowLeft, Calendar, Mail, Phone, MapPin, Briefcase, Building2, Link as LinkIcon, ExternalLink, FileText, Loader2, ArrowUpRight } from 'lucide-react'

export default function IngresoDetalle({ ingresoId, onVolver, onVerBusqueda }) {
  const [ingreso, setIngreso] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarDetalle() {
      try {
        setLoading(true)
        const data = await getIngresoById(ingresoId)
        setIngreso(data)
      } catch (error) {
        console.error('Error cargando detalle de ingreso:', error)
      } finally {
        setLoading(false)
      }
    }
    cargarDetalle()
  }, [ingresoId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Cargando detalle del ingreso...</span>
      </div>
    )
  }

  if (!ingreso) return <div className="p-6 text-slate-500">No se encontró el registro de ingreso.</div>

  const candidato = ingreso.postulaciones?.candidatos
  const puesto = ingreso.postulaciones?.puestos
  const vacante = ingreso.postulaciones?.vacantes // Datos de la búsqueda/vacante asociada

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <button
        onClick={onVolver}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al listado de ingresos
      </button>

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
              <Calendar className="w-4 h-4 text-emerald-600" /> {new Date(ingreso.fecha_ingreso + 'T00:00:00').toLocaleDateString()}
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

      </div>
    </div>
  )
}