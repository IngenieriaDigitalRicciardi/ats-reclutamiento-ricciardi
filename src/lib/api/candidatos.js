import { supabase } from '../supabaseClient'

// Obtener todos los candidatos ordenados por fecha de creación
export async function getCandidatos() {
  const { data, error } = await supabase
    .from('candidato')
    .select(`
      *,
      fuente_reclutamiento (
        nombre
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Obtener un candidato por su ID
export async function getCandidatoById(id) {
  const { data, error } = await supabase
    .from('candidato')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Crear un nuevo candidato
export async function crearCandidato(datosCandidato) {
  const { data, error } = await supabase
    .from('candidato')
    .insert([datosCandidato])
    .select()
    .single()

  if (error) throw error
  return data
}

// Actualizar un candidato existente
export async function actualizarCandidato(id, datosCandidato) {
  const { data, error } = await supabase
    .from('candidato')
    .update(datosCandidato)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Eliminar un candidato
export async function eliminarCandidato(id) {
  const { error } = await supabase
    .from('candidato')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}