import { supabase } from '../supabaseClient'

// 1. Crear Postulación (Vincular búsqueda existente con candidato existente)
export async function crearPostulacion(idBusqueda, idCandidato, notas) {
  const { data, error } = await supabase
    .from('postulacion')
    .insert([{
      id_busqueda: idBusqueda,
      id_candidato: idCandidato,
      embudo_estado: 'Postulado'  
    }])
    .select()

  if (error) throw error
  return data[0]
}

// 2. Obtener listado de postulaciones (trae datos del candidato y de la búsqueda relacionada)
export async function getPostulaciones() {
  const { data, error } = await supabase
    .from('postulacion')
    .select(`
      *,
      candidato:id_candidato (*),
      busqueda:id_busqueda (
        id,
        estado,
        puesto:id_puesto (nombre),
        empresa:id_empresa (nombre),
        sucursal:id_sucursal (nombre)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}