import React, { useState, useEffect } from 'react'
import { getBusquedas } from '../lib/api/busquedas'
import { crearPostulacion } from '../lib/api/postulaciones'
import { supabase } from '../lib/supabaseClient'
import { validarPostulacion } from '../utils/validaciones'
import AlertBanner from '../components/ui/alertbanner'
import { UserPlus, Link as LinkIcon, Phone, Search, Briefcase, Loader2, ArrowLeft, User, ExternalLink } from 'lucide-react'

export default function NuevaPostulacion({ onVolver }) {
  const [busquedas, setBusquedas] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensajeFeedback, setMensajeFeedback] = useState(null)

  // Estados para la búsqueda y selección de candidatos
  const [textoBusquedaCandidato, setTextoBusquedaCandidato] = useState('')
  const [candidatosEncontrados, setCandidatosEncontrados] = useState([])
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null)
  const [buscandoCandidatos, setBuscandoCandidatos] = useState(false)

  // Estado para el formulario de postulación (sin notas)
  const [idBusqueda, setIdBusqueda] = useState('')

  // Cargar búsquedas abiertas al iniciar
  useEffect(() => {
    async function cargarBusquedasAbiertas() {
      try {
        const data = await getBusquedas()
        const abiertas = (data || []).filter(b => b.estado === 'Abierta')
        setBusquedas(abiertas)
      } catch (error) {
        setMensajeFeedback({ tipo: 'error', texto: 'Error al cargar búsquedas disponibles.' })
      }
    }
    cargarBusquedasAbiertas()
  }, [])

  // Buscar candidatos en tiempo real
  useEffect(() => {
    async function buscarCandidatos() {
      if (!textoBusquedaCandidato || textoBusquedaCandidato.trim().length < 2) {
        setCandidatosEncontrados([])
        return
      }

      try {
        setBuscandoCandidatos(true)
        const query = textoBusquedaCandidato.trim()

        const { data: ingresosData, error: errorIngresos } = await supabase
          .from('ingreso')
          .select('postulacion(id_candidato)')

        if (errorIngresos) throw errorIngresos

        const idsCandidatosIngresados = ingresosData
          ?.map(i => i.postulacion?.id_candidato)
          .filter(Boolean) || []

        let supabaseQuery = supabase
          .from('candidato')
          .select('*')
          .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,telefono.ilike.%${query}%`)
          .limit(10)

        if (idsCandidatosIngresados.length > 0) {
          const idsString = `(${idsCandidatosIngresados.join(',')})`
          supabaseQuery = supabaseQuery.not('id', 'in', idsString)
        }

        const { data, error } = await supabaseQuery

        if (error) throw error
        
        setCandidatosEncontrados((data || []).slice(0, 5))

      } catch (error) {
        console.error('Error buscando candidatos:', error)
      } finally {
        setBuscandoCandidatos(false)
      }
    }

    const timer = setTimeout(buscarCandidatos, 300)
    return () => clearTimeout(timer)
  }, [textoBusquedaCandidato])

  // Manejar el envío de la postulación
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensajeFeedback(null)

    try {
      setLoading(true)

      const idBusquedaNum = idBusqueda ? Number(idBusqueda) : null
      const idCandidatoNum = candidatoSeleccionado ? Number(candidatoSeleccionado.id) : null

      // Validamos sin notas
      const resultadoValidacion = await validarPostulacion({
        idCandidato: idCandidatoNum,
        idBusqueda: idBusquedaNum
      })

      if (!resultadoValidacion.esValido) {
        const primerError = Object.values(resultadoValidacion.errores)[0]
        setMensajeFeedback({ tipo: 'error', texto: primerError })
        setLoading(false)
        return
      }

      // Creamos la postulación sin notas (o enviando null/vacío según tu api de postulaciones)
      await crearPostulacion(idBusquedaNum, idCandidatoNum, null)

      setMensajeFeedback({ tipo: 'success', texto: '¡Postulación registrada con éxito!' })
      
      setTimeout(() => {
        onVolver()
      }, 1500)

    } catch (error) {
      if (error.message && error.message.includes('unique_candidato_busqueda')) {
        setMensajeFeedback({ 
          tipo: 'error', 
          texto: 'Este candidato ya se encuentra postulado a esta búsqueda laboral.' 
        })
      } else {
        setMensajeFeedback({ 
          tipo: 'error', 
          texto: 'Error al registrar la postulación: ' + error.message 
        })
      }
      setLoading(false)
    } finally {
      if (!mensajeFeedback || mensajeFeedback.tipo !== 'success') {
        setLoading(false)
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Cabecera y botón volver */}
      <div className="flex items-center gap-4">
        <button
          onClick={onVolver}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva Postulación</h1>
          <p className="text-sm text-slate-500">Busca un candidato existente en el sistema y asígnalo a una búsqueda.</p>
        </div>
      </div>

      <AlertBanner 
        tipo={mensajeFeedback?.tipo} 
        texto={mensajeFeedback?.texto} 
        onClose={() => setMensajeFeedback(null)} 
      />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* SECCIÓN 1: Selección de Candidato */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            1. Buscar Candidato en la Base de Datos
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
                      <LinkIcon className="w-3.5 h-3.5" /> Ver CV (Drive) <ExternalLink className="w-3 h-3" />
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
            <div className="space-y-3 relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Escribe el nombre, apellido o teléfono del candidato para buscar..."
                  value={textoBusquedaCandidato}
                  onChange={(e) => setTextoBusquedaCandidato(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {buscandoCandidatos && (
                  <Loader2 className="absolute right-3 top-3 w-4 h-4 text-blue-600 animate-spin" />
                )}
              </div>

              {candidatosEncontrados.length > 0 && (
                <div className="absolute left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {candidatosEncontrados.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCandidatoSeleccionado(c)
                        setTextoBusquedaCandidato('')
                        setCandidatosEncontrados([])
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{c.nombre} {c.apellido || ''}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Tel: {c.telefono}</span>
                          {c.email && <span>• {c.email}</span>}
                        </div>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">Seleccionar</span>
                    </div>
                  ))}
                </div>
              )}

              {textoBusquedaCandidato.length >= 2 && candidatosEncontrados.length === 0 && !buscandoCandidatos && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                  <span>No se encontró ningún candidato con ese criterio. Recuerda que debes crearlo primero en el apartado de Candidatos.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* SECCIÓN 2: Selección de Búsqueda Laboral (Sin notas) */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            2. Seleccionar Búsqueda Laboral
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Puesto / Búsqueda Activa *</label>
            <select
              value={idBusqueda}
              onChange={(e) => setIdBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Selecciona una posición abierta...</option>
              {busquedas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.puesto?.nombre} — {b.empresa?.nombre} ({b.sucursal?.nombre})
                </option>
              ))}
            </select>
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
            disabled={loading || !candidatoSeleccionado}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Vincular Postulación
          </button>
        </div>

      </form>
    </div>
  )
}