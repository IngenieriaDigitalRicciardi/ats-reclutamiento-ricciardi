import React, { useState, useEffect } from "react";
import { getEntrevistasPorPostulacion, eliminarEntrevista } from "../lib/api/entrevistas";
import NuevaEntrevista from "./NuevaEntrevista";
import AlertBanner from "../components/ui/alertbanner";
import { X, Calendar, User, Edit3, Trash2, Loader2, Plus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Entrevista({ postulacion, onClose }) {
  const [entrevistas, setEntrevistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);
  
  // Controla si se muestra el formulario de alta/edición y qué entrevista se está editando
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [entrevistaSeleccionada, setEntrevistaSeleccionada] = useState(null);

  useEffect(() => {
    if (postulacion?.id) {
      cargarEntrevistas();
    }
  }, [postulacion]);

  async function cargarEntrevistas() {
    try {
      setLoading(true);
      const data = await getEntrevistasPorPostulacion(postulacion.id);
      setEntrevistas(data || []);
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al cargar las entrevistas: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta entrevista?")) return;
    try {
      await eliminarEntrevista(id);
      setMensajeFeedback({ tipo: "success", texto: "Entrevista eliminada." });
      cargarEntrevistas();
    } catch (error) {
      setMensajeFeedback({ tipo: "error", texto: "Error al eliminar: " + error.message });
    }
  };

  const candidatoNombre = `${postulacion?.candidato?.nombre || ""} ${postulacion?.candidato?.apellido || ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
              Gestión de Entrevistas
            </h2>
            <p className="text-xs text-slate-500 truncate max-w-[240px] sm:max-w-none">
              Candidato: <span className="font-semibold text-slate-700">{candidatoNombre}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <AlertBanner 
            tipo={mensajeFeedback?.tipo} 
            texto={mensajeFeedback?.texto} 
            onClose={() => setMensajeFeedback(null)} 
          />

          {/* Botón para abrir formulario de alta si está cerrado */}
          {!mostrarFormulario && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEntrevistaSeleccionada(null);
                  setMostrarFormulario(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 sm:py-2 rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nueva Entrevista
              </button>
            </div>
          )}

          {/* Formulario de Alta / Modificación controlado por NuevaEntrevista */}
          {mostrarFormulario && (
            <NuevaEntrevista
              postulacion={postulacion}
              entrevistaEditar={entrevistaSeleccionada}
              onGuardado={async () => {
                setMostrarFormulario(false);

                // Si es una nueva entrevista (no edición), actualizamos el estado del embudo
                if (!entrevistaSeleccionada && postulacion?.id) {
                  try {
                    await supabase
                      .from("postulacion")
                      .update({ embudo_estado: "Entrevistado", updated_at: new Date() })
                      .eq("id", postulacion.id);
                  } catch (err) {
                    console.error("Error al actualizar estado de la postulación:", err);
                  }
                }

                setEntrevistaSeleccionada(null);
                setMensajeFeedback({
                  tipo: "success",
                  texto: entrevistaSeleccionada ? "Entrevista modificada con éxito." : "Entrevista registrada con éxito."
                });
                cargarEntrevistas();
              }}
              onClose={() => {
                setMostrarFormulario(false);
                setEntrevistaSeleccionada(null);
              }}
            />
          )}

          {/* Historial */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Historial de Entrevistas
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs">Cargando entrevistas...</span>
              </div>
            ) : entrevistas.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-xl">
                No hay entrevistas registradas para este candidato.
              </p>
            ) : (
              <div className="space-y-3">
                {entrevistas.map((ent) => (
                  <div key={ent.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          {ent.fecha ? new Date(ent.fecha).toLocaleString() : 'Fecha no especificada'}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <User className="w-3 h-3 flex-shrink-0" /> {ent.entrevistador}
                        </span>
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {ent.modalidad}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ent.estado === "Realizada" ? "bg-emerald-50 text-emerald-700" :
                          ent.estado === "Descartado" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {ent.estado}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {ent.conocimiento_experiencia && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700 block text-[11px]">Experiencia:</span> 
                            <span className="text-slate-600 break-words">{ent.conocimiento_experiencia}</span>
                          </div>
                        )}
                        {ent.evaluacion && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700 block text-[11px]">Evaluación:</span> 
                            <span className="text-slate-600 break-words">{ent.evaluacion}</span>
                          </div>
                        )}
                      </div>

                      {ent.motivo_descarte && (
                        <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-100 break-words">
                          <span className="font-semibold">Motivo de descarte:</span> {ent.motivo_descarte}
                        </p>
                      )}

                      {ent.observaciones && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 break-words">
                          <span className="font-semibold text-slate-700">Observaciones:</span> {ent.observaciones}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end sm:justify-start gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => {
                          setEntrevistaSeleccionada(ent);
                          setMostrarFormulario(true);
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modificar Entrevista"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(ent.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Entrevista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Pie */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 sm:py-2 rounded-lg transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
}