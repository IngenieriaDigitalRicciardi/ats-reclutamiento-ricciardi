import React, { useState, useEffect } from "react";
import { getCandidatos, eliminarCandidato } from "../lib/api/candidatos";
import { supabase } from "../lib/supabaseClient"; 
import AlertBanner from "../components/ui/alertbanner";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Link as LinkIcon,
  ExternalLink,
  Edit3,
  Trash2,
  Loader2,
  UserX,
  Filter,
  RotateCcw,
  MapPin,
  CreditCard,
  Globe,
  CheckCircle2,
} from "lucide-react";

export default function Candidatos({ onNuevoCandidato, onEditarCandidato }) {
  const [candidatos, setCandidatos] = useState([]);
  const [idsIngresados, setIdsIngresados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  const [filtros, setFiltros] = useState({
    texto: "",
    dni: "",
    ciudad: "",
    fuente: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);

      const [dataCandidatos, { data: ingresosData, error: errorIngresos }] =
        await Promise.all([
          getCandidatos(),
          supabase.from("ingreso").select("postulacion(id_candidato)"),
        ]);

      if (errorIngresos) throw errorIngresos;

      const setIngresados = new Set(
        ingresosData?.map((i) => i.postulacion?.id_candidato).filter(Boolean) ||
          [],
      );

      setCandidatos(dataCandidatos || []);
      setIdsIngresados(setIngresados);
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al cargar los datos: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleEliminar = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Estás segura de que deseas eliminar a ${nombre}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await eliminarCandidato(id);
      setCandidatos((prev) => prev.filter((c) => c.id !== id));
      setMensajeFeedback({
        tipo: "success",
        texto: "Candidato eliminado correctamente.",
      });
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto:
          "No se pudo eliminar el candidato (puede que tenga postulaciones activas).",
      });
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({ texto: "", dni: "", ciudad: "", fuente: "" });
  };

  const candidatosFiltrados = candidatos.filter((c) => {
    const matchTexto =
      filtros.texto.trim() === "" ||
      `${c.nombre || ""} ${c.apellido || ""} ${c.telefono || ""} ${c.email || ""}`
        .toLowerCase()
        .includes(filtros.texto.toLowerCase());

    const matchDni =
      filtros.dni.trim() === "" ||
      (c.dni || "").toLowerCase().includes(filtros.dni.toLowerCase());

    const matchCiudad =
      filtros.ciudad.trim() === "" ||
      (c.ciudad || "").toLowerCase().includes(filtros.ciudad.toLowerCase());

    const nombreFuente = c.fuente_reclutamiento?.nombre || c.fuente || "";
    const matchFuente =
      filtros.fuente.trim() === "" ||
      nombreFuente.toLowerCase().includes(filtros.fuente.toLowerCase());

    return matchTexto && matchDni && matchCiudad && matchFuente;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Cargando base de candidatos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Directorio de Candidatos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Administra la base general de talentos, perfiles y enlaces de CVs.
          </p>
        </div>
        <button
          onClick={onNuevoCandidato}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Candidato
        </button>
      </div>

      <AlertBanner
        tipo={mensajeFeedback?.tipo}
        texto={mensajeFeedback?.texto}
        onClose={() => setMensajeFeedback(null)}
      />

      {/* Panel de Filtros Completos */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filtros de búsqueda</span>
          </div>
          {(filtros.texto ||
            filtros.dni ||
            filtros.ciudad ||
            filtros.fuente) && (
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filtro General */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="texto"
              placeholder="Nombre, tel, email..."
              value={filtros.texto}
              onChange={handleFiltroChange}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filtro por DNI */}
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="dni"
              placeholder="Filtrar por DNI..."
              value={filtros.dni}
              onChange={handleFiltroChange}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filtro por Ciudad */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="ciudad"
              placeholder="Filtrar por ciudad..."
              value={filtros.ciudad}
              onChange={handleFiltroChange}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filtro por Fuente */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="fuente"
              placeholder="Filtrar por fuente (ej: LinkedIn)..."
              value={filtros.fuente}
              onChange={handleFiltroChange}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Contenedor de Candidatos (Tarjetas en móvil, Tabla en Desktop) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {candidatosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <UserX className="w-8 h-8 text-slate-300" />
              <span>No se encontraron candidatos con los filtros seleccionados.</span>
            </div>
          </div>
        ) : (
          <>
            {/* Vista en Tarjetas para Móvil (< 768px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {candidatosFiltrados.map((c) => {
                const yaIngresado = idsIngresados.has(c.id);

                return (
                  <div
                    key={c.id}
                    className={`p-4 space-y-3 ${
                      yaIngresado ? "bg-emerald-50/60" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm">
                            {c.nombre} {c.apellido || ""}
                          </span>
                          {yaIngresado && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Ingresado
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Registrado el {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onEditarCandidato(c.id)}
                          className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Editar candidato"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleEliminar(
                              c.id,
                              `${c.nombre} ${c.apellido || ""}`
                            )
                          }
                          className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar candidato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">DNI / Ubicación</span>
                        <span className="font-medium text-slate-700">{c.dni || "Sin DNI"}</span>
                        <span className="block text-slate-500">{c.ciudad || "Sin ciudad"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contacto</span>
                        <div className="flex items-center gap-1 font-medium text-slate-700 truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {c.telefono}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1 text-slate-500 truncate mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {c.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        {c.fuente_reclutamiento?.nombre || c.fuente ? (
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium">
                            {c.fuente_reclutamiento?.nombre || c.fuente}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sin fuente</span>
                        )}
                      </div>

                      <div>
                        {c.cv_url ? (
                          <a
                            href={c.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                          >
                            <LinkIcon className="w-3.5 h-3.5" /> Ver CV <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Sin CV</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista en Tabla Tradicional (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Candidato</th>
                    <th className="p-4">DNI / Ubicación</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">Fuente</th>
                    <th className="p-4">CV (Drive)</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {candidatosFiltrados.map((c) => {
                    const yaIngresado = idsIngresados.has(c.id);

                    return (
                      <tr
                        key={c.id}
                        className={`transition-colors ${yaIngresado ? "bg-emerald-50/60 hover:bg-emerald-50" : "hover:bg-slate-50/50"}`}
                      >
                        {/* Nombre con etiqueta de Ingresado */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {c.nombre} {c.apellido || ""}
                            </span>
                            {yaIngresado && (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Ingresado
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Registrado el{" "}
                            {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* DNI y Ciudad */}
                        <td className="p-4">
                          <div className="text-xs font-medium text-slate-700">
                            {c.dni ? (
                              `DNI: ${c.dni}`
                            ) : (
                              <span className="text-slate-400 italic">
                                Sin DNI
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {c.ciudad || (
                              <span className="text-slate-400 italic">
                                Sin ciudad
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="p-4">
                          <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                            {c.telefono}
                          </div>
                          {c.email && (
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />{" "}
                              {c.email}
                            </div>
                          )}
                        </td>

                        {/* Fuente */}
                        <td className="p-4">
                          {c.fuente_reclutamiento?.nombre || c.fuente ? (
                            <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                              {c.fuente_reclutamiento?.nombre || c.fuente}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              —
                            </span>
                          )}
                        </td>

                        {/* CV */}
                        <td className="p-4">
                          {c.cv_url ? (
                            <a
                              href={c.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                            >
                              <LinkIcon className="w-3.5 h-3.5" /> Ver CV{" "}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Sin enlace de CV
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEditarCandidato(c.id)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar candidato"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleEliminar(
                                  c.id,
                                  `${c.nombre} ${c.apellido || ""}`,
                                )
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar candidato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}