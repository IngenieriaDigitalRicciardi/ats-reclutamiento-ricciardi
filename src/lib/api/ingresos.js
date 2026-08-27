import { supabase } from "../supabaseClient";

export async function getIngresos() {
  const { data, error } = await supabase
    .from("ingreso")
    .select(`
      id,
      fecha_ingreso,
      observaciones,
      created_at,
      postulacion (
        id,
        candidato (
          nombre,
          apellido,
          telefono
        ),
        busqueda (
          puesto ( nombre ),
          empresa ( nombre ),
          sucursal ( nombre )
        )
      )
    `)
    .order("fecha_ingreso", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Mapeamos los datos para asegurar que lleguen limpios a la tabla de la vista
  return data.map((item) => {
    const cand = item.postulacion?.candidato;
    const busq = item.postulacion?.busqueda;

    return {
      id: item.id,
      fecha_ingreso: item.fecha_ingreso,
      observaciones: item.observaciones,
      colaborador: cand ? `${cand.nombre || ""} ${cand.apellido || ""}`.trim() : "—",
      telefono: cand?.telefono || "—",
      puesto: busq?.puesto?.nombre || "—",
      empresa: busq?.empresa?.nombre || "—",
      sucursal: busq?.sucursal?.nombre || "—",
      postulacion_id: item.postulacion?.id
    };
  });
}

export async function getIngresoById(id) {
  const { data, error } = await supabase
    .from("ingreso")
    .select(`
      id,
      fecha_ingreso,
      observaciones,
      created_at,
      postulacion (
        id,
        candidato (
          nombre,
          apellido,
          telefono,
          email,
          ciudad,
          cv_url
        ),
        busqueda (
          id,
          puesto ( nombre ),
          empresa ( nombre ),
          sucursal ( nombre )
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    postulaciones: {
      candidatos: data.postulacion?.candidato,
      puestos: data.postulacion?.busqueda?.puesto,
      vacantes: data.postulacion?.busqueda // Incluye el objeto con el id y datos de la búsqueda
    }
  };
}