import { supabase } from '../supabaseClient'

// 1. Obtener todas las entrevistas con datos relacionados completos (ideal para paneles generales)
export async function getEntrevistas() {
  const { data, error } = await supabase
    .from("entrevista")
    .select(`
      *, 
      postulacion:id_postulacion (
        id,
        candidato (nombre, apellido), 
        busqueda (
          puesto (nombre)
        )
      )
    `)
    .order("fecha", { ascending: true })

  if (error) throw error
  return data
}

// 2. Obtener entrevistas filtradas por una postulación específica
export async function getEntrevistasPorPostulacion(postulacionId) {
  const { data, error } = await supabase
    .from("entrevista")
    .select(`
      *, 
      postulacion:id_postulacion (
        candidato (nombre, apellido), 
        busqueda (
          puesto (nombre)
        )
      )
    `)
    .eq("id_postulacion", postulacionId)
    .order("fecha", { ascending: true })

  if (error) throw error
  return data
}

// 3. Registrar una nueva entrevista
export async function crearEntrevista(datosEntrevista) {
  const { data, error } = await supabase
    .from('entrevista')
    .insert([datosEntrevista])
    .select()
    .single()

  if (error) throw error
  return data
}

// 4. Actualizar una entrevista existente
export async function actualizarEntrevista(id, datosEntrevista) {
  const { data, error } = await supabase
    .from('entrevista')
    .update(datosEntrevista)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 5. Eliminar una entrevista
export async function eliminarEntrevista(id) {
  const { error } = await supabase
    .from('entrevista')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}