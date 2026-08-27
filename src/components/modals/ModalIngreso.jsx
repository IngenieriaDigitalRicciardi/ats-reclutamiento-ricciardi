import React, { useState, useEffect } from 'react'
import { Calendar, FileText, Loader2, X, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function ModalIngreso({ idPostulacion, idEntrevista, onClose, onGuardadoExitoso }) {
  const [formData, setFormData] = useState({
    fecha_ingreso: new Date().toISOString().split('T')[0],
    observaciones: '',
    dni: ''
  })
  
  const [candidatoId, setCandidatoId] = useState(null)
  const [tieneDniRegistrado, setTieneDniRegistrado] = useState(false)
  const [loadingDatos, setLoadingDatos] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pasoConfirmacion, setPasoConfirmacion] = useState(false)

  // Al abrir el modal, buscamos si la postulación ya tiene un DNI cargado en su candidato
  useEffect(() => {
    async function verificarDniCandidato() {
      try {
        setLoadingDatos(true)
        // Buscamos la postulación y hacemos un join con candidato para obtener el DNI y su ID
        const { data, error } = await supabase
          .from('postulacion')
          .select(`
            id_candidato,
            candidato (
              id,
              dni
            )
          `)
          .eq('id', idPostulacion)
          .single()

        if (error) throw error

        if (data?.candidato) {
          setCandidatoId(data.candidato.id)
          if (data.candidato.dni && data.candidato.dni.trim() !== '') {
            setTieneDniRegistrado(true)
            setFormData(prev => ({ ...prev, dni: data.candidato.dni }))
          }
        }
      } catch (err) {
        console.error('Error al verificar el DNI del candidato:', err)
        setError('No se pudo verificar la información del candidato.')
      } finally {
        setLoadingDatos(false)
      }
    }

    verificarDniCandidato()
  }, [idPostulacion])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar que el DNI no esté vacío antes de continuar
    if (!formData.dni || formData.dni.trim() === '') {
      setError('El DNI es obligatorio para registrar el ingreso.')
      return
    }
    
    // Si todavía no pasó por la advertencia, la mostramos primero
    if (!pasoConfirmacion) {
      setError(null)
      setPasoConfirmacion(true)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Si el DNI no estaba registrado previamente en el candidato, lo actualizamos
      if (!tieneDniRegistrado && candidatoId) {
        const { error: errorUpdateCandidato } = await supabase
          .from('candidato')
          .update({ dni: formData.dni.trim() })
          .eq('id', candidatoId)

        if (errorUpdateCandidato) throw errorUpdateCandidato
      }

      // 2. Insertar en la tabla INGRESO
      const { error: insertError } = await supabase
        .from('ingreso')
        .insert([{
          id_postulacion: idPostulacion,
          id_entrevista: idEntrevista || null,
          fecha_ingreso: formData.fecha_ingreso,
          observaciones: formData.observaciones
        }])

      if (insertError) throw insertError

      // 3. Asegurarse de que la postulación quedó en estado 'Aprobado'
      const { error: updateError } = await supabase
        .from('postulacion')
        .update({ embudo_estado: 'Aprobado' })
        .eq('id', idPostulacion)

      if (updateError) throw updateError

      onGuardadoExitoso()
      onClose()
    } catch (err) {
      setError('Error al registrar el ingreso: ' + err.message)
      setPasoConfirmacion(false) // Volvemos atrás si hay error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Candidato Aprobado! Registrar Ingreso</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingDatos ? (
          <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Verificando datos del candidato...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{error}</div>}
            
            {/* Alerta visual de que la acción es irreversible */}
            {pasoConfirmacion ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>¿Estás completamente seguro?</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Esta acción **no es reversible**. Al confirmar el ingreso, el estado del candidato quedará fijado como <b>Aprobado</b> de forma definitiva y ya no se podrá modificar ni eliminar del sistema.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Estás a punto de dar de alta formalmente al candidato. Completa los detalles del ingreso para la compañía.
                </p>

                {/* Campo DNI Obligatorio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    DNI del Candidato *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ingrese el número de DNI..."
                      value={formData.dni}
                      disabled={tieneDniRegistrado} // Si ya lo tenía, evitamos que lo modifiquen por error aquí (o quítalo si prefieres que sea editable siempre)
                      onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                      className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        tieneDniRegistrado ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {tieneDniRegistrado && (
                    <span className="text-[10px] text-emerald-600 mt-0.5 block">
                      ✓ DNI recuperado automáticamente del perfil del candidato.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha de Ingreso *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={formData.fecha_ingreso}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Observaciones / Condiciones</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      rows="3"
                      placeholder="Ej: Ingresa con esquema híbrido, sueldo inicial acordado..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {pasoConfirmacion ? (
                <button
                  type="button"
                  onClick={() => setPasoConfirmacion(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Volver
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm text-white disabled:opacity-50 ${
                  pasoConfirmacion ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {pasoConfirmacion ? 'Sí, confirmar ingreso definitivo' : 'Confirmar Ingreso'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}