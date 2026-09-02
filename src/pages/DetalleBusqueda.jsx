import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import AlertBanner from "../components/ui/alertbanner";
import Entrevista from "./Entrevista";
import {
  ArrowLeft,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Users,
  Filter,
  ArrowUpDown,
  Link as LinkIcon,
  ExternalLink,
  Phone,
  Loader2,
  Lock,
} from "lucide-react";

export default function DetalleBusqueda({ busquedaId, onVolver }) {
  const [busqueda, setBusqueda] = useState(null);
  const [postulaciones, setPostulaciones] = useState([]);
  const [idsIngresos, setIdsIngresos] = useState(new Set()); // 👈 Almacenará los IDs de postulaciones que ya están en la tabla ingreso
  const [loading, setLoading] = useState(true);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  // Estado para filtros y ordenamiento específicos de esta búsqueda
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [ordenFecha, setOrdenFecha] = useState("recientes");
  const [busquedaTexto, setBusquedaTexto] = useState("");

  // Control para ver entrevistas de un candidato dentro de esta búsqueda
  const [postulacionSeleccionadaEntrevista, setPostulacionSeleccionadaEntrevista] = useState(null);

  useEffect(() => {
    if (busquedaId) {
      cargarDetalleBusqueda();
    }
  }, [busquedaId]);

  async function cargarDetalleBusqueda() {
    try {
      setLoading(true);
      
      // 1. Cargar datos de la búsqueda
      const { data: dataBusqueda, error: errorBusqueda } = await supabase
        .from("busqueda")
        .select(`
          *,
          puesto:id_puesto(nombre),
          empresa:id_empresa(nombre),
          sucursal:id_sucursal(nombre)
        `)
        .eq("id", busquedaId)
        .single();

      if (errorBusqueda) throw errorBusqueda;
      setBusqueda(dataBusqueda);

      // 2. Cargar todas las postulaciones asociadas a esta búsqueda
      const { data: dataPostulaciones, error: errorPostulaciones } = await supabase
        .from("postulacion")
        .select(`
          *,
          candidato:id_candidato(*)
        `)
        .eq("id_busqueda", busquedaId);

      if (errorPostulaciones) throw errorPostulaciones;
      const posts = dataPostulaciones || [];
      setPostulaciones(posts);

      // 3. Consultar cuáles de estas postulaciones ya tienen un registro en la tabla 'ingreso'
      if (posts.length > 0) {
        const idsPosts = posts.map(p => p.id);
        const { data: dataIngresos, error: errorIngresos } = await supabase
          .from("ingreso")
          .select("id_postulacion")
          .in("id_postulacion", idsPosts);

        if (!errorIngresos && dataIngresos) {
          const idsSet = new Set(dataIngresos.map(i => i.id_postulacion));
          setIdsIngresos(idsSet);
        }
      }

    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al cargar el detalle de la búsqueda: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  // Cambiar etapa del embudo con validación estricta de la tabla ingreso
  const handleCambiarEstado = async (idPostulacion, nuevoEstado) => {
    // Si la postulación ya tiene un registro de ingreso, bloqueamos la acción por completo
    if (idsIngresos.has(idPostulacion)) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Acción denegada: Este candidato ya fue ingresado oficialmente y su registro está blindado.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("postulacion")
        .update({ embudo_estado: nuevoEstado, updated_at: new Date() })
        .eq("id", idPostulacion);

      if (error) throw error;

      setPostulaciones((prev) =>
        prev.map((p) =>
          p.id === idPostulacion ? { ...p, embudo_estado: nuevoEstado } : p
        )
      );
      setMensajeFeedback({
        tipo: "success",
        texto: "Etapa actualizada correctamente.",
      });
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al actualizar la etapa: " + error.message,
      });
    }
  };

  // Filtrado y Ordenamiento
  const postulacionesFiltradas = postulaciones
    .filter((p) => {
      const nombreCompleto = `${p.candidato?.nombre || ""} ${p.candidato?.apellido || ""}`.toLowerCase();
      const telefono = p.candidato?.telefono || "";
      
      const coincideTexto =
        !busquedaTexto ||
        nombreCompleto.includes(busquedaTexto.toLowerCase()) ||
        telefono.includes(busquedaTexto);

      const coincideEstado =
        filtroEstado === "TODOS" || p.embudo_estado === filtroEstado;

      return coincideTexto && coincideEstado;
    })
    .sort((a, b) => {
      const fechaA = new Date(a.created_at || 0);
      const fechaB = new Date(b.created_at || 0);
      return ordenFecha === "recientes" ? fechaB - fechaA : fechaA - fechaB;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Cargando detalle de la búsqueda...</span>
      </div>
    );
  }

  if (!busqueda) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-slate-600">No se encontró la información de la búsqueda.</p>
        <button
          onClick={onVolver}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CABECERA Y BOTÓN DE RETORNO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Volver al listado"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">
                {busqueda.puesto?.nombre || "Puesto sin nombre"}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                busqueda.estado === 'Activa' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {busqueda.estado || "Activa"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-600" /> {busqueda.empresa?.nombre}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> {busqueda.sucursal?.nombre}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Creada el: {new Date(busqueda.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Postulados</div>
            <div className="text-lg font-bold text-slate-800">{postulaciones.length} candidatos</div>
          </div>
        </div>
      </div>

      <AlertBanner
        tipo={mensajeFeedback?.tipo}
        texto={mensajeFeedback?.texto}
        onClose={() => setMensajeFeedback(null)}
      />

      {/* PANEL DE FILTROS Y ORDENAMIENTO */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Filtrar por candidato o tel..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:outline-none"
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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Antigüedad:</span>
          <select
            value={ordenFecha}
            onChange={(e) => setOrdenFecha(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:outline-none"
          >
            <option value="recientes">Más recientes primero</option>
            <option value="antiguas">Más antiguas primero (Viejas)</option>
          </select>
        </div>
      </div>

      {/* LISTADO / TABLA DE CANDIDATOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Candidato</th>
                <th className="p-4">Fecha de Postulación</th>
                <th className="p-4">CV Adjunto</th>
                <th className="p-4">Etapa (Embudo)</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {postulacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 text-xs italic">
                    No se encontraron candidatos con los filtros seleccionados en esta búsqueda.
                  </td>
                </tr>
              ) : (
                postulacionesFiltradas.map((p) => {
                  const estaIngresado = idsIngresos.has(p.id); // 👈 Validamos si existe en la tabla ingreso

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {p.candidato?.nombre} {p.candidato?.apellido || ""}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {p.candidato?.telefono || "Sin teléfono"}
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-600">
                        <div className="font-medium">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
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
                            <LinkIcon className="w-3.5 h-3.5" /> Abrir CV <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No adjunto</span>
                        )}
                      </td>

                      <td className="p-4">
                        {estaIngresado ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Lock className="w-3 h-3 text-emerald-600" /> Aprobado (Ingresado)
                          </span>
                        ) : (
                          <select
                            value={p.embudo_estado || "Postulado"}
                            onChange={(e) => handleCambiarEstado(p.id, e.target.value)}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                          >
                            <option value="Postulado">Postulado</option>
                            <option value="En Revision">En Revision</option>
                            <option value="Entrevistado">Entrevistado</option>
                            <option value="Oferta">Oferta</option>
                            <option value="Aprobado">Aprobado</option>
                            <option value="Descartado">Descartado</option>
                          </select>
                        )}
                      </td>

                      {/* Acciones bloqueadas si ya está en la tabla Ingreso */}
                      <td className="p-4 text-right">
                        {estaIngresado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Lock className="w-3 h-3 text-emerald-600" /> Ingresado
                          </span>
                        ) : (
                          <button
                            onClick={() => setPostulacionSeleccionadaEntrevista(p)}
                            className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            Entrevistas
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / SECCIÓN DE GESTIÓN DE ENTREVISTAS */}
      {postulacionSeleccionadaEntrevista && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Gestión de Entrevistas
                </h3>
                <p className="text-xs text-slate-500">
                  Candidato: <span className="font-semibold text-slate-700">{postulacionSeleccionadaEntrevista.candidato?.nombre} {postulacionSeleccionadaEntrevista.candidato?.apellido}</span>
                </p>
              </div>
              <button
                onClick={() => setPostulacionSeleccionadaEntrevista(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <Entrevista 
              postulacion={postulacionSeleccionadaEntrevista}
              onClose={() => setPostulacionSeleccionadaEntrevista(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}