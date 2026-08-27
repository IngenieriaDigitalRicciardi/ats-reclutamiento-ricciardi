import { supabase } from '../lib/supabaseClient';

// Obtener búsquedas activas con relaciones
export const getBusquedas = async (estadoFilter = null) => {
  let query = supabase
    .from('BUSQUEDA')
    .select(`
      ID,
      estado,
      created_at,
      EMPRESA ( ID, NOMBRE ),
      SUCURSAL ( ID, NOMBRE ),
      PUESTO ( 
        ID, 
        NOMBRE,
        DEPARTAMENTO ( ID, NOMBRE )
      ),
      USUARIO ( ID, NOMBRE, EMAIL )
    `)
    .order('created_at', { ascending: false });

  if (estadoFilter) {
    query = query.eq('estado', estadoFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Crear una nueva Búsqueda
export const createBusqueda = async ({ idPuesto, idEmpresa, idSucursal, idUsuario }) => {
  const { data, error } = await supabase
    .from('BUSQUEDA')
    .insert([
      {
        ID_PUESTO: idPuesto,
        ID_EMPRESA: idEmpresa,
        ID_SUCURSAL: idSucursal,
        ID_USUARIO: idUsuario || null,
        estado: 'Abierta'
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Cambiar estado (Abierta, Pausada, Cerrada)
export const updateEstadoBusqueda = async (idBusqueda, nuevoEstado) => {
  const { data, error } = await supabase
    .from('BUSQUEDA')
    .update({ estado: nuevoEstado })
    .eq('ID', idBusqueda)
    .select()
    .single();

  if (error) throw error;
  return data;
};