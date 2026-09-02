import React, { useState, useEffect } from 'react'
import { getEmpresas, getSucursales, getPuestos } from '../lib/api/catalogos'
import { getBusquedas, createBusqueda } from '../lib/api/busquedas'
import { supabase } from '../lib/supabaseClient'
import AlertBanner from '../components/ui/alertbanner'
import { ArrowLeft, Building2, MapPin, Briefcase, CheckCircle2, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'

export default function NuevaBusqueda({ onVolver, onVerBusqueda }) {
  const [empresas, setEmpresas] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [puestos, setPuestos] = useState([])
  const [loading, setLoading] = useState(false)
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [mensajeFeedback, setMensajeFeedback] = useState(null)
  
  // Estado para almacenar una búsqueda duplicada detectada y mostrar su advertencia
  const [busquedaExistente, setBusquedaExistente] = useState(null)

  const [formData, setFormData] = useState({
    id_empresa: '',
    id_sucursal: '',
    id_puesto: '',
    estado: 'Abierta'
  })

  useEffect(() => {
    Promise.all([getEmpresas(), getSucursales(), getPuestos()])
      .then(([empRes, sucRes, pueRes]) => {
        setEmpresas(empRes || [])
        setSucursales(sucRes || [])
        setPuestos(pueRes || [])
      })
      .catch((err) => {
        console.error('Error al cargar catálogos:', err)
        setMensajeFeedback({ tipo: 'error', texto: 'Error al cargar los catálogos del sistema.' })
      })
      .finally(() => setCargandoCatalogos(false))
  }, [])

  // Filtrado de sucursales según la empresa seleccionada
  const sucursalesFiltradas = sucursales.filter(
    (s) => String(s.id_empresa) === String(formData.id_empresa)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensajeFeedback(null)
    setBusquedaExistente(null)
    setLoading(true)

    try {
      const idEmpresaNum = Number(formData.id_empresa)
      const idSucursalNum = Number(formData.id_sucursal)
      const idPuestoNum = Number(formData.id_puesto)

      // 1. Validar si ya existe una búsqueda ABIERTA con la misma empresa, sucursal y puesto
      const { data: duplicadas, error: errorBusqueda } = await supabase
        .from('busqueda')
        .select(`
          id,
          estado,
          empresa:id_empresa (nombre),
          sucursal:id_sucursal (nombre),
          puesto:id_puesto (nombre)
        `)
        .eq('id_empresa', idEmpresaNum)
        .eq('id_sucursal', idSucursalNum)
        .eq('id_puesto', idPuestoNum)
        .eq('estado', 'Abierta')
        .maybeSingle()

      if (errorBusqueda) {
        console.error('Error al verificar búsquedas duplicadas:', errorBusqueda)
      }

      // Si encuentra una coincidencia abierta, frenamos y mostramos la alerta de advertencia (warning)
      if (duplicadas) {
        setBusquedaExistente(duplicadas)
        setMensajeFeedback({ 
          tipo: 'error', 
          texto: 'Ya existe una búsqueda activa con esta combinación de Empresa, Sucursal y Puesto.' 
        })
        setLoading(false)
        return
      }

      // 2. Si no existe duplicada, procedemos a crearla
      const datosAEnviar = {
        ...formData,
        id_empresa: idEmpresaNum,
        id_sucursal: idSucursalNum,
        id_puesto: idPuestoNum
      }

      await createBusqueda(datosAEnviar)
      
      setMensajeFeedback({ tipo: 'success', texto: '¡Búsqueda laboral creada con éxito!' })
      
      setTimeout(() => {
        onVolver()
      }, 1500)

    } catch (error) {
      setMensajeFeedback({ tipo: 'error', texto: 'Error al crear búsqueda: ' + error.message })
      setLoading(false)
    } finally {
      if (!mensajeFeedback || (mensajeFeedback.tipo !== 'success' && !busquedaExistente)) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      
      {/* Botón Volver */}
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la lista
      </button>

      <AlertBanner 
        tipo={mensajeFeedback?.tipo} 
        texto={mensajeFeedback?.texto} 
        onClose={() => setMensajeFeedback(null)} 
      />

      {/* Panel de Advertencia Visual si ya existe una búsqueda activa idéntica */}
      {busquedaExistente && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-amber-800">
              <p className="font-semibold">Búsqueda activa detectada (ID: #{busquedaExistente.id})</p>
              <p className="text-amber-700 text-xs leading-relaxed">
                Ya hay una posición abierta para el puesto de <strong className="font-semibold">{busquedaExistente.puesto?.nombre}</strong> en <strong className="font-semibold">{busquedaExistente.empresa?.nombre}</strong> ({busquedaExistente.sucursal?.nombre}).
              </p>
            </div>
          </div>
          
          {/* Botón para ver la búsqueda existente directamente */}
          <button
            type="button"
            onClick={() => {
              if (onVerBusqueda) {
                onVerBusqueda(busquedaExistente.id);
              } else {
                onVolver();
              }
            }}
            className="shrink-0 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Ver búsqueda <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tarjeta Contenedora */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-xl font-bold text-slate-800">Nueva Búsqueda Laboral</h1>
          <p className="text-sm text-slate-500 mt-1">
            Completa las opciones requeridas en orden para abrir una nueva posición.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {cargandoCatalogos ? (
            <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Cargando datos del sistema...</span>
            </div>
          ) : (
            <>
              {/* EMPRESA */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Empresa <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  value={formData.id_empresa}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      id_empresa: e.target.value, 
                      id_sucursal: '' 
                    })
                    setBusquedaExistente(null) // Limpia el aviso si cambia de empresa
                  }}
                  required
                >
                  <option value="">Seleccionar Empresa...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              {/* SUCURSAL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Sucursal <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    !formData.id_empresa
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer'
                  }`}
                  disabled={!formData.id_empresa}
                  value={formData.id_sucursal}
                  onChange={(e) => {
                    setFormData({ ...formData, id_sucursal: e.target.value })
                    setBusquedaExistente(null)
                  }}
                  required
                >
                  <option value="">
                    {formData.id_empresa ? 'Seleccionar Sucursal...' : 'Primero selecciona una empresa'}
                  </option>
                  {sucursalesFiltradas.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {/* PUESTO */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Puesto <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  value={formData.id_puesto}
                  onChange={(e) => {
                    setFormData({ ...formData, id_puesto: e.target.value })
                    setBusquedaExistente(null)
                  }}
                  required
                >
                  <option value="">Seleccionar Puesto...</option>
                  {puestos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.departamento?.nombre ? `— [${p.departamento.nombre}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ESTADO */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Estado Inicial
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  <option value="Abierta">Abierta</option>
                  <option value="Pausada">Pausada</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>
            </>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onVolver}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || cargandoCatalogos}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando...' : 'Crear Búsqueda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}