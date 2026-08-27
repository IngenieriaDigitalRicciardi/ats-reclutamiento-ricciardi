import { supabase } from '../supabaseClient'

export async function getDashboardData(fechaInicio, fechaFin) {
  // 1. Búsquedas
  let queryBusquedas = supabase.from('busqueda').select('*, empresa(*), puesto(*), sucursal(*)')
  if (fechaInicio) queryBusquedas = queryBusquedas.gte('created_at', fechaInicio)
  if (fechaFin) queryBusquedas = queryBusquedas.lte('created_at', fechaFin)
  const { data: busquedas, error: errBusquedas } = await queryBusquedas
  if (errBusquedas) throw errBusquedas

  // 2. Postulaciones
  let queryPostulaciones = supabase.from('postulacion').select('*')
  if (fechaInicio) queryPostulaciones = queryPostulaciones.gte('created_at', fechaInicio)
  if (fechaFin) queryPostulaciones = queryPostulaciones.lte('created_at', fechaFin)
  const { data: postulaciones, error: errPostulaciones } = await queryPostulaciones
  if (errPostulaciones) throw errPostulaciones

  // 3. Entrevistas
  let queryEntrevistas = supabase.from('entrevista').select('*, postulacion(*, candidato(*), busqueda(*, puesto(*), empresa(*)))')
  if (fechaInicio) queryEntrevistas = queryEntrevistas.gte('fecha', fechaInicio)
  if (fechaFin) queryEntrevistas = queryEntrevistas.lte('fecha', fechaFin)
  const { data: entrevistas, error: errEntrevistas } = await queryEntrevistas
  if (errEntrevistas) throw errEntrevistas

  // 4. Total de candidatos (opcional, si tienes una tabla candidatos)
  const { count: totalCandidatos } = await supabase.from('candidato').select('*', { count: 'exact', head: true })

  return {
    busquedas: busquedas || [],
    postulaciones: postulaciones || [],
    entrevistas: entrevistas || [],
    totalCandidatos: totalCandidatos || 0
  }
}