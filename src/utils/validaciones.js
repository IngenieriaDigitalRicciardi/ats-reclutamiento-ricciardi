/**
 * Valida los campos esenciales de una entrevista
 */
export function validarEntrevista({ fecha, entrevistador, estado, motivoDescarte }) {
  const errores = {}

  if (!fecha) {
    errores.fecha = "La fecha y hora son obligatorias."
  }

  if (!entrevistador || entrevistador.trim() === "") {
    errores.entrevistador = "El nombre del entrevistador es obligatorio."
  }

  if (estado === "Descartado" && (!motivoDescarte || motivoDescarte.trim() === "")) {
    errores.motivoDescarte = "Debe indicar el motivo del descarte cuando el estado es 'Descartado'."
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores
  }
}

export function validarCandidato({ nombre, apellido, telefono, ciudad, id_fuente, email, cv_url }) {
  const errores = {}

  // Obligatorio: Nombre
  if (!nombre || nombre.trim() === "") {
    errores.nombre = "El nombre es obligatorio."
  }

  // Obligatorio: Apellido
  if (!apellido || apellido.trim() === "") {
    errores.apellido = "El apellido es obligatorio."
  }

  // Obligatorio: Teléfono (Clave única)
  if (!telefono || telefono.trim() === "") {
    errores.telefono = "El teléfono es obligatorio."
  } else if (!/^[0-9\s+()-]{7,20}$/.test(telefono.trim())) {
    errores.telefono = "Ingrese un número de teléfono válido."
  }

  // Obligatorio: Ciudad
  if (!ciudad || ciudad.trim() === "") {
    errores.ciudad = "La ciudad es obligatoria."
  }

  // Obligatorio: Fuente de reclutamiento
  if (!id_fuente || String(id_fuente).trim() === "") {
    errores.id_fuente = "Seleccione una fuente de reclutamiento."
  }

  // Opcional con validación de formato si se completa: Email
  if (email && email.trim() !== "") {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regexEmail.test(email.trim())) {
      errores.email = "El formato del correo electrónico no es válido."
    }
  }

  // Opcional con validación de formato si se completa: URL del CV
  if (cv_url && cv_url.trim() !== "") {
    try {
      new URL(cv_url.trim())
    } catch (_) {
      errores.cv_url = "Ingrese una URL válida (ej: https://...)"
    }
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores
  }
}

export async function validarPostulacionDuplicada(idCandidato, idBusqueda) {
  if (!idCandidato || !idBusqueda) return false

  try {
    const { data, error } = await supabase
      .from('postulacion')
      .select('id')
      .eq('id_candidato', idCandidato)
      .eq('id_busqueda', idBusqueda)
      .maybeSingle()

    if (error) {
      console.error('Error en Supabase al validar duplicado:', error)
      return false // O true si prefieres bloquear por seguridad ante errores de red
    }

    // Si data existe, significa que ya hay un registro con ese candidato y búsqueda
    return !!data
  } catch (error) {
    console.error('Excepción al validar postulación duplicada:', error)
    return false
  }
}

export function validarNotasPostulacion(notas, maxLargo = 500) {
  if (!notas) return true
  return notas.length <= maxLargo
}

/**
 * Valida de forma completa la postulación antes de enviarla
 */
export async function validarPostulacion({ idCandidato, idBusqueda, notas }) {
  const errores = {}

  if (!idCandidato) {
    errores.candidato = "Debe seleccionar un candidato."
  }

  if (!idBusqueda) {
    errores.busqueda = "Debe seleccionar una búsqueda laboral."
  }

  if (idCandidato && idBusqueda) {
    const esDuplicado = await validarPostulacionDuplicada(idCandidato, idBusqueda)
    if (esDuplicado) {
      errores.duplicado = "El candidato ya se encuentra postulado a esta búsqueda."
    }
  }

  if (!validarNotasPostulacion(notas)) {
    errores.notas = "Las observaciones superan el límite de 500 caracteres."
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores
  }
}