import React, { useState, useEffect } from "react";
import { crearEntrevista, actualizarEntrevista } from "../lib/api/entrevistas";
import { supabase } from "../lib/supabaseClient";
import AlertBanner from "../components/ui/alertbanner";
import { validarEntrevista } from "../utils/validaciones";
import { Plus, X, Loader2 } from "lucide-react";

export default function NuevaEntrevista({
  postulacion,
  entrevistaEditar,
  onGuardado,
  onClose,
}) {
  const [fecha, setFecha] = useState("");
  const [entrevistador, setEntrevistador] = useState("");
  const [modalidad, setModalidad] = useState("Presencial");
  const [estado, setEstado] = useState("Pendiente");
  const [conocimientoExperiencia, setConocimientoExperiencia] = useState("");
  const [evaluacion, setEvaluacion] = useState("");
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [mensajeFeedback, setMensajeFeedback] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [loading, setLoading] = useState(false);

  const esEdicion = Boolean(entrevistaEditar);

  // Cargar datos al editar o predeterminar el usuario actual en caso de nueva entrevista
  useEffect(() => {
    async function inicializarFormulario() {
      if (esEdicion && entrevistaEditar) {
        const fechaIsoLocal = entrevistaEditar.fecha
          ? new Date(entrevistaEditar.fecha).toISOString().slice(0, 16)
          : "";
        setFecha(fechaIsoLocal);
        setEntrevistador(entrevistaEditar.entrevistador || "");
        setModalidad(entrevistaEditar.modalidad || "Presencial");
        setEstado(entrevistaEditar.estado || "Pendiente");
        setConocimientoExperiencia(
          entrevistaEditar.conocimiento_experiencia || "",
        );
        setEvaluacion(entrevistaEditar.evaluacion || "");
        setMotivoDescarte(entrevistaEditar.motivo_descarte || "");
        setObservaciones(entrevistaEditar.observaciones || "");
      } else {
        // Si es una nueva entrevista, buscamos el usuario activo en Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Intentamos sacar el nombre de la metadata del usuario, o usamos el email como alternativa
            const nombreUsuario = user.user_metadata?.nombre || user.user_metadata?.full_name || user.email || "";
            setEntrevistador(nombreUsuario);
          }
        } catch (error) {
          console.error("Error al obtener el usuario actual:", error);
        }
      }
    }

    inicializarFormulario();
  }, [entrevistaEditar, esEdicion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeFeedback(null);

    // Validación externa centralizada
    const validacion = validarEntrevista({ fecha, entrevistador, estado, motivoDescarte });

    if (!validacion.esValido) {
      setErroresCampos(validacion.errores);
      setMensajeFeedback({
        tipo: "error",
        texto: "Por favor, completa los campos obligatorios marcados en rojo.",
      });
      return;
    }

    setErroresCampos({});

    try {
      setLoading(true);
      
      const datosPayload = {
        id_postulacion: Number(postulacion?.id),
        fecha,
        entrevistador,
        modalidad,
        estado,
        conocimiento_experiencia: conocimientoExperiencia,
        evaluacion,
        motivo_descarte: estado === "Descartado" ? motivoDescarte : null,
        observaciones,
      };

      if (esEdicion) {
        await actualizarEntrevista(entrevistaEditar.id, datosPayload);
      } else {
        await crearEntrevista(datosPayload);
      }

      onGuardado(); 
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al guardar: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {esEdicion ? "Modificar Entrevista" : "Registrar Nueva Entrevista"}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AlertBanner
        tipo={mensajeFeedback?.tipo}
        texto={mensajeFeedback?.texto}
        onClose={() => setMensajeFeedback(null)}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              FECHA Y HORA *
            </label>
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none ${
                erroresCampos.fecha ? "border-red-500 bg-red-50/30" : "border-slate-300"
              }`}
            />
            {erroresCampos.fecha && (
              <span className="text-[10px] text-red-500 mt-0.5 block">{erroresCampos.fecha}</span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ENTREVISTADOR *
            </label>
            <input
              type="text"
              placeholder="Nombre del reclutador..."
              value={entrevistador}
              onChange={(e) => setEntrevistador(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none ${
                erroresCampos.entrevistador ? "border-red-500 bg-red-50/30" : "border-slate-300"
              }`}
            />
            {erroresCampos.entrevistador && (
              <span className="text-[10px] text-red-500 mt-0.5 block">{erroresCampos.entrevistador}</span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              MODALIDAD
            </label>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none cursor-pointer"
            >
              <option value="Presencial">Presencial</option>
              <option value="Videollamada">Videollamada</option>
              <option value="Telefonica">Telefónica</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ESTADO
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Descartado">Descartado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              CONOCIMIENTO Y EXPERIENCIA
            </label>
            <textarea
              rows="2"
              placeholder="Detalles sobre su experiencia técnica..."
              value={conocimientoExperiencia}
              onChange={(e) => setConocimientoExperiencia(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              EVALUACIÓN GENERAL
            </label>
            <textarea
              rows="2"
              placeholder="Desempeño general en la entrevista..."
              value={evaluacion}
              onChange={(e) => setEvaluacion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {estado === "Descartado" && (
            <div>
              <label className="block text-[11px] font-semibold text-red-500 mb-1">
                MOTIVO DE DESCARTE *
              </label>
              <input
                type="text"
                placeholder="Razón por la cual se descarta..."
                value={motivoDescarte}
                onChange={(e) => setMotivoDescarte(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-xs bg-red-50 focus:outline-none ${
                  erroresCampos.motivoDescarte ? "border-red-500" : "border-red-300"
                }`}
              />
              {erroresCampos.motivoDescarte && (
                <span className="text-[10px] text-red-500 mt-0.5 block">{erroresCampos.motivoDescarte}</span>
              )}
            </div>
          )}

          <div className={estado !== "Descartado" ? "md:col-span-2" : ""}>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              OBSERVACIONES
            </label>
            <input
              type="text"
              placeholder="Observaciones adicionales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {esEdicion && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {loading ? "Guardando..." : esEdicion ? "Actualizar Entrevista" : "Guardar Entrevista"}
          </button>
        </div>
      </form>
    </div>
  );
}