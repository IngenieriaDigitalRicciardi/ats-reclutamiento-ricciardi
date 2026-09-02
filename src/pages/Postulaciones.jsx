import React, { useState, useEffect } from "react";
import { getPostulaciones } from "../lib/api/postulaciones";
import { supabase } from "../lib/supabaseClient";
import AlertBanner from "../components/ui/alertbanner";
import Entrevista from "../pages/Entrevista";
import ModalIngreso from "../components/modals/ModalIngreso";
import {
  Plus,
  Link as LinkIcon,
  Phone,
  Briefcase,
  Loader2,
  ExternalLink,
  Filter,
  Calendar,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function Postulaciones({
  onNuevaPostulacion,
  onVerDetalleBusqueda,
}) {
  const [postulaciones, setPostulaciones] = useState([]);
  const [empresasBD, setEmpresasBD] = useState([]);
  const [sucursalesBD, setSucursalesBD] = useState([]);

  const [loading, setLoading] = useState(true);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  const [
    postulacionSeleccionadaEntrevista,
    setPostulacionSeleccionadaEntrevista,
  ] = useState(null);

  const [postulacionAEliminar, setPostulacionAEliminar] = useState(null);
  const [tieneEntrevistas, setTieneEntrevistas] = useState(false);
  const [verModalAdvertencia, setVerModalAdvertencia] = useState(false);

  const [postulacionAprobandoId, setPostulacionAprobandoId] = useState(null);
  const [mostrarModalIngreso, setMostrarModalIngreso] = useState(false);

  const [filtroCandidato, setFiltroCandidato] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("TODAS");
  const [filtroSucursal, setFiltroSucursal] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  async function cargarDatosIniciales() {
    try {
      setLoading(true);
      const [resPostulaciones, resEmpresas, resSucursales] = await Promise.all([
        getPostulaciones(),
        supabase.from("empresa").select("id, nombre").order("nombre"),
        supabase.from("sucursal").select("id, nombre").order("nombre"),
      ]);

      setPostulaciones(resPostulaciones || []);
      setEmpresasBD(resEmpresas.data || []);
      setSucursalesBD(resSucursales.data || []);
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al cargar los datos: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCambiarEstado = async (id, nuevoEmbudoEstado) => {
    if (nuevoEmbudoEstado === "Aprobado") {
      setPostulacionAprobandoId(id);
      setMostrarModalIngreso(true);
      return;
    }

    try {
      const { error: errorPostulacion } = await supabase
        .from("postulacion")
        .update({ embudo_estado: nuevoEmbudoEstado, updated_at: new Date() })
        .eq("id", id);

      if (errorPostulacion) throw errorPostulacion;

      if (nuevoEmbudoEstado === "Entrevistado") {
        const { error: errorEntrevistas } = await supabase
          .from("entrevista")
          .update({ estado: "Pendiente" })
          .eq("id_postulacion", id);

        if (errorEntrevistas) throw errorEntrevistas;
      }

      if (nuevoEmbudoEstado === "Descartado") {
        const { error: errorEntrevistas } = await supabase
          .from("entrevista")
          .update({ estado: "Descartado" })
          .eq("id_postulacion", id);

        if (errorEntrevistas) throw errorEntrevistas;
      }

      setPostulaciones((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, embudo_estado: nuevoEmbudoEstado } : p
        )
      );
      setMensajeFeedback({
        tipo: "success",
        texto: "Etapa del proceso y sus entrevistas actualizadas.",
      });
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al actualizar estado: " + error.message,
      });
    }
  };

  const comprobarAntesDeEliminar = async (postulacion) => {
    setPostulacionAEliminar(postulacion);

    const { data: entrevistas, error } = await supabase
      .from("entrevista")
      .select("id")
      .eq("id_postulacion", postulacion.id);

    setTieneEntrevistas(!error && entrevistas && entrevistas.length > 0);
    setVerModalAdvertencia(true);
  };

  const confirmarEliminacion = async () => {
    if (!postulacionAEliminar) return;

    try {
      const { error } = await supabase
        .from("postulacion")
        .delete()
        .eq("id", postulacionAEliminar.id);

      if (error) throw error;

      setPostulaciones((prev) => prev.filter((p) => p.id !== postulacionAEliminar.id));
      setVerModalAdvertencia(false);
      setPostulacionAEliminar(null);
      setMensajeFeedback({
        tipo: "success",
        texto: "Postulación eliminada correctamente.",
      });
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al intentar eliminar la postulación: " + error.message,
      });
      setVerModalAdvertencia(false);
    }
  };

  const postulacionesFiltradas = postulaciones.filter((p) => {
    const nombreCompleto =
      `${p.candidato?.nombre || ""} ${p.candidato?.apellido || ""}`.toLowerCase();
    const telefono = p.candidato?.telefono || "";
    const coincideCandidato =
      !filtroCandidato ||
      nombreCompleto.includes(filtroCandidato.toLowerCase()) ||
      telefono.includes(filtroCandidato);

    const nombrePuesto = (p.busqueda?.puesto?.nombre || "").toLowerCase();
    const coincidePuesto =
      !filtroPuesto || nombrePuesto.includes(filtroPuesto.toLowerCase());

    const coincideEmpresa =
      filtroEmpresa === "TODAS" ||
      p.busqueda?.empresa?.nombre === filtroEmpresa;
    const coincideSucursal =
      filtroSucursal === "TODAS" ||
      p.busqueda?.sucursal?.nombre === filtroSucursal;

    const coincideEstado =
      filtroEstado === "TODOS" || p.embudo_estado === filtroEstado;

    return (
      coincideCandidato &&
      coincidePuesto &&
      coincideEmpresa &&
      coincideSucursal &&
      coincideEstado
    );
  });

  const limpiarFiltros = () => {
    setFiltroCandidato("");
    setFiltroPuesto("");
    setFiltroEmpresa("TODAS");
    setFiltroSucursal("TODAS");
    setFiltroEstado("TODOS");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Cargando postulaciones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Gestión de Postulaciones
          </h1>
          <p className="text-sm text-slate-500">
            Cruza información de candidatos, vacantes y etapas del embudo.
          </p>
        </div>
        <button
          onClick={onNuevaPostulacion}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Postulación
        </button>
      </div>

      <AlertBanner
        tipo={mensajeFeedback?.tipo}
        texto={mensajeFeedback?.texto}
        onClose={() => setMensajeFeedback(null)}
      />

      {/* PANEL DE FILTROS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            Panel de Búsqueda Específica
          </div>
          <button
            onClick={limpiarFiltros}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              CANDIDATO
            </label>
            <input
              type="text"
              placeholder="Nombre o Tel..."
              value={filtroCandidato}
              onChange={(e) => setFiltroCandidato(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              PUESTO
            </label>
            <input
              type="text"
              placeholder="Ej: Vendedor..."
              value={filtroPuesto}
              onChange={(e) => setFiltroPuesto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              EMPRESA
            </label>
            <select
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="TODAS">Todas las Empresas</option>
              {empresasBD.map((emp) => (
                <option key={emp.id} value={emp.nombre}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              SUCURSAL
            </label>
            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="TODAS">Todas las Sucursales</option>
              {sucursalesBD.map((suc) => (
                <option key={suc.id} value={suc.nombre}>
                  {suc.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              ETAPA EMBUDO
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:outline-none"
            >
              <option value="TODOS">Todas las Etapas</option>
              <option value="Postulado">Postulado</option>
              <option value="En Revision">En Revision</option>
              <option value="Entrevistado">Entrevistado</option>
              <option value="Oferta">Oferta</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Descartado">Descartado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Candidato</th>
                <th className="p-4">Puesto y Destino</th>
                <th className="p-4">CV</th>
                <th className="p-4">Etapa del Embudo</th>
                <th className="p-4 text-right">Creado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {postulacionesFiltradas.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">
                      {p.candidato?.nombre} {p.candidato?.apellido || ""}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {p.candidato?.telefono}
                    </div>
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() =>
                        onVerDetalleBusqueda &&
                        onVerDetalleBusqueda(p.busqueda_id || p.busqueda?.id)
                      }
                      className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 text-left transition-colors cursor-pointer group"
                    >
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {p.busqueda?.puesto?.nombre || "Puesto no especificado"}
                        <span className="block text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-normal">
                          Ver detalle de la búsqueda &rarr;
                        </span>
                      </span>
                    </button>
                    <div className="text-[11px] text-slate-500 mt-1">
                      <b>Empresa:</b> {p.busqueda?.empresa?.nombre} <br />
                      <b>Sucursal:</b> {p.busqueda?.sucursal?.nombre}
                    </div>
                  </td>

                  <td className="p-4">
                    {p.candidato?.cv_url ? (
                      <a
                        href={p.candidato.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Abrir{" "}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No adjunto
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <select
                        value={p.embudo_estado || "Postulado"}
                        disabled={p.embudo_estado === "Aprobado"}
                        onChange={(e) =>
                          handleCambiarEstado(p.id, e.target.value)
                        }
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                          p.embudo_estado === "Aprobado"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-80 cursor-not-allowed"
                            : p.embudo_estado === "Descartado"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : p.embudo_estado === "Entrevistado"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        <option value="Postulado">Postulado</option>
                        <option value="En Revision">En Revision</option>
                        <option value="Entrevistado">Entrevistado</option>
                        <option value="Oferta">Oferta</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Descartado">Descartado</option>
                      </select>

                      {(p.embudo_estado === "Entrevistado" || p.embudo_estado === "Descartado") && (
                        <button
                          onClick={() => setPostulacionSeleccionadaEntrevista(p)}
                          className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shadow-sm ${
                            p.embudo_estado === "Descartado"
                              ? "text-red-800 bg-red-50 hover:bg-red-100 border-red-200"
                              : "text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200"
                          }`}
                          title="Gestionar entrevistas de esta postulación"
                        >
                          <Calendar className={`w-3.5 h-3.5 ${p.embudo_estado === "Descartado" ? "text-red-600" : "text-amber-600"}`} />
                          Ver Entrevistas
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="p-4 text-right text-xs text-slate-400">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="p-4 text-center">
                    {p.embudo_estado === "Aprobado" ? (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-block">
                        Bloqueado
                      </span>
                    ) : (
                      <button
                        onClick={() => comprobarAntesDeEliminar(p)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar postulación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModalIngreso && (
        <ModalIngreso
          idPostulacion={postulacionAprobandoId}
          onClose={() => {
            setMostrarModalIngreso(false);
            setPostulacionAprobandoId(null);
          }}
          onGuardadoExitoso={() => {
            setMensajeFeedback({
              tipo: "success",
              texto: "¡Ingreso registrado exitosamente en el sistema!",
            });
            cargarDatosIniciales();
          }}
        />
      )}

      {verModalAdvertencia && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-800">¿Eliminar postulación?</h3>
            </div>

            <p className="text-sm text-slate-600">
              Estás a punto de eliminar la postulación de{" "}
              <span className="font-semibold text-slate-800">
                {postulacionAEliminar?.candidato?.nombre}{" "}
                {postulacionAEliminar?.candidato?.apellido}
              </span>{" "}
              para el puesto de{" "}
              <span className="font-semibold text-slate-800">
                {postulacionAEliminar?.busqueda?.puesto?.nombre}
              </span>.
            </p>

            {tieneEntrevistas && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-bold">⚠️ Atención:</p>
                <p>
                  Esta postulación cuenta con registros de entrevistas asociados. Si confirmas la acción, los datos vinculados también se eliminarán de forma permanente.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setVerModalAdvertencia(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {postulacionSeleccionadaEntrevista && (
        <Entrevista
          postulacion={postulacionSeleccionadaEntrevista}
          onClose={() => setPostulacionSeleccionadaEntrevista(null)}
        />
      )}
    </div>
  );
}