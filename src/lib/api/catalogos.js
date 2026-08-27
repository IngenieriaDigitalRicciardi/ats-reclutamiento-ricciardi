import { supabase } from '../supabaseClient'

// ---------- EMPRESA ----------
export async function getEmpresas() {
  const { data, error } = await supabase.from('empresa').select('*').order('nombre')
  if (error) throw error
  return data
}

export async function createEmpresa(nombre) {
  const { data, error } = await supabase.from('empresa').insert({ nombre }).select().single()
  if (error) throw error
  return data
}

export async function deleteEmpresa(id) {
  const { error } = await supabase.from('empresa').delete().eq('id', id)
  if (error) throw error
}

// ---------- SUCURSAL ----------
export async function getSucursales() {
  const { data, error } = await supabase
    .from('sucursal')
    .select('*, empresa(nombre)')
    .order('nombre')
  if (error) throw error
  return data
}

export async function createSucursal(idEmpresa, nombre) {
  const { data, error } = await supabase
    .from('sucursal')
    .insert({ id_empresa: idEmpresa, nombre })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSucursal(id) {
  const { error } = await supabase.from('sucursal').delete().eq('id', id)
  if (error) throw error
}

// ---------- DEPARTAMENTO (solo lectura, no se toca desde acá) ----------
export async function getDepartamentos() {
  const { data, error } = await supabase.from('departamento').select('*').order('nombre')
  if (error) throw error
  return data
}

// ---------- PUESTO ----------
export async function getPuestos() {
  const { data, error } = await supabase
    .from('puesto')
    .select('*, departamento(nombre)')
    .order('nombre')
  if (error) throw error
  return data
}

export async function createPuesto(idDepartamento, nombre) {
  const { data, error } = await supabase
    .from('puesto')
    .insert({ id_departamento: idDepartamento, nombre })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePuesto(id) {
  const { error } = await supabase.from('puesto').delete().eq('id', id)
  if (error) throw error
}