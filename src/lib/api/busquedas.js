import { supabase } from '../supabaseClient'

// Obtener todas las búsquedas laborales
export async function getBusquedas() {
  const { data, error } = await supabase
    .from('busqueda')
    .select(`
      *,
      puesto (
        id,
        nombre,
        departamento (nombre)
      ),
      empresa (id, nombre),
      sucursal (id, nombre),
      postulacion (id)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Crear una nueva búsqueda
export async function createBusqueda(datos) {
  const { data, error } = await supabase
    .from('busqueda')
    .insert(datos)
    .select()
    .single()

  if (error) throw error
  return data
}

// Cambiar estado o actualizar búsqueda
export async function updateBusqueda(id, datos) {
  const { data, error } = await supabase
    .from('busqueda')
    .update(datos)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBusqueda(id) {
  const { error } = await supabase
    .from('busqueda')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}