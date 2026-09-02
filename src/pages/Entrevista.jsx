import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import AlertBanner from "../components/ui/alertbanner";
import { X, Calendar, User, FileText, CheckCircle2, Loader2, Save } from "lucide-react";

export default function NuevaEntrevista({ postulacion, entrevistaEditar, onGuardado, onClose }) {
  const [formData, setFormData] = useState({
    fecha: "",
    entrevistador: "",
    modalidad: "Presencial",
    estado: "Pendiente",
    conocimiento_experiencia: "",
    evaluacion: "",
    motivo_descarte: "",
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  useEffect(() => {
    if (entrevistaEditar) {
      // Si estamos editando, formateamos la fecha para que el input type="datetime-local" la entienda (YYYY-MM-DDTHH:mm)
      let fechaFormateada = "";
      if (entrevistaEditar.fecha) {
        const d = new Date(entrevistaEditar.fecha);
        // Ajuste simple para string local ISO sin la Z al final
        fechaFormateada = d.toISOString().slice(0, 16);
      }

      setFormData({
        fecha: fechaFormateada,
        entrevistador: entrevistaEditar.entrevistador || "",
        modalidad: entrevistaEditar.modalidad || "Presencial",
        estado: entrevistaEditar.estado || "Pendiente",
        conocimiento_experiencia: entrevistaEditar.conocimiento_experiencia || "",
        evaluacion: entrevistaEditar.evaluacion || "",
        motivo_descarte: entrevistaEditar.motivo_descarte || "",
        observaciones: entrevistaEditar.observaciones || "",
      });
    } else {
      // Valores por defecto para nueva entrevista
      setFormData({
        fecha: "",
        entrevistador: "",
        modalidad: "Presencial",
        estado: "Pendiente",
        conocimiento_experiencia: "",
        evaluacion: "",
        motivo_descarte: "",
        observaciones: "",
      });
    }
  }, [entrevistaEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fecha || !formData.entrevistador) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Por favor complete la fecha y el nombre del entrevistador.",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        id_postulacion: postulacion.id,
        fecha: formData.fecha,
        entrevistador: formData.entrevistador,
        modalidad: formData.modalidad,
        estado: formData.estado,
        conocimiento_experiencia: formData.conocimiento_experiencia,
        evaluacion: formData.evaluacion,
        motivo_descarte: formData.estado === "Descartado" ? formData.motivo_descarte : null,
        observaciones: formData.observaciones,
        updated_at: new Date(),
      };

      if (entrevistaEditar?.id) {
        // Actualizar
        const { error } = await supabase
          .from("entrevista")
          .update(payload)
          .eq("id", entrevistaEditar.id);

        if (error) throw error;
      } else {
        // Insertar nueva
        const { error } = await supabase
          .from("entrevista")
          .insert([payload]);

        if (error) throw error;
      }

      // Notificar al componente padre que se guardó con éxito
      if (onGuardado) onGuardado();
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al guardar la entrevista: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" />
          {entrevistaEditar ? "Modificar Entrevista" : "Registrar Nueva Entrevista"}
        </h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-200/55 transition-colors"
        >
          Cancelar / Volver
        </button>
      </div>

      <AlertBanner
        tipo={mensajeFeedback?.tipo}
        texto={mensajeFeedback?.texto}
        onClose={() => setMensajeFeedback(null)}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha y Hora */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha y Hora <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Entrevistador */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Entrevistador <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="entrevistador"
              placeholder="Ej: Lic. María Gómez"
              value={formData.entrevistador}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modalidad
            </label>
            <select
              name="modalidad"
              value={formData.modalidad}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:outline-none"
            >
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="Telefónica">Telefónica</option>
            </select>
          </div>

          {/* Estado de la entrevista */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estado de la Entrevista
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:outline-none"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Realizada">Realizada</option>
              <option value="Descartado">Descartado</option>
            </select>
          </div>
        </div>

        {/* Campos de texto descriptivos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conocimiento / Experiencia
            </label>
            <textarea
              name="conocimiento_experiencia"
              rows="2"
              placeholder="Detalle sobre su experiencia técnica previa..."
              value={formData.conocimiento_experiencia}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evaluación General
            </label>
            <textarea
              name="evaluacion"
              rows="2"
              placeholder="Impresión general del candidato..."
              value={formData.evaluacion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>

        {/* Condicional si se selecciona estado Descartado */}
        {formData.estado === "Descartado" && (
          <div>
            <label className="block text-xs font-semibold text-red-700 mb-1">
              Motivo de Descarte <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="motivo_descarte"
              placeholder="¿Por qué motivo se descarta al candidato?"
              value={formData.motivo_descarte}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-red-200 rounded-xl text-xs bg-red-50/50 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              required={formData.estado === "Descartado"}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observaciones Adicionales
          </label>
          <textarea
            name="observaciones"
            rows="2"
            placeholder="Notas internas, pretensión salarial, disponibilidad..."
            value={formData.observaciones}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        {/* Botón de acción */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{entrevistaEditar ? "Guardar Cambios" : "Registrar Entrevista"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}