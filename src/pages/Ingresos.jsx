import React, { useState, useEffect } from "react";
import { getIngresos } from "../lib/api/ingresos";
import AlertBanner from "../components/ui/alertbanner";
import { 
  Loader2, 
  UserCheck, 
  Calendar, 
  Briefcase, 
  Building2, 
  MapPin, 
  FileText, 
  Eye, 
  Filter, 
  Download,
  FileSpreadsheet
} from "lucide-react";

export default function Ingresos({ onVerDetalle }) {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  // Estados para los filtros
  const [filtroColaborador, setFiltroColaborador] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("TODAS");
  const [filtroSucursal, setFiltroSucursal] = useState("TODAS");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  useEffect(() => {
    cargarIngresos();
  }, []);

  async function cargarIngresos() {
    try {
      setLoading(true);
      const data = await getIngresos();
      setIngresos(data || []);
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al cargar los ingresos: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  // Extraer listas únicas para los desplegables de filtros basados en los datos cargados
  const empresasDisponibles = [...new Set(ingresos.map((item) => item.empresa).filter(Boolean))].sort();
  const sucursalesDisponibles = [...new Set(ingresos.map((item) => item.sucursal).filter(Boolean))].sort();

  // Lógica de filtrado cruzado
  const ingresosFiltrados = ingresos.filter((item) => {
    const colaboradorTexto = (item.colaborador || "").toLowerCase();
    const telefonoTexto = item.telefono || "";
    const coincideColaborador =
      !filtroColaborador ||
      colaboradorTexto.includes(filtroColaborador.toLowerCase()) ||
      telefonoTexto.includes(filtroColaborador);

    const puestoTexto = (item.puesto || "").toLowerCase();
    const coincidePuesto =
      !filtroPuesto || puestoTexto.includes(filtroPuesto.toLowerCase());

    const coincideEmpresa =
      filtroEmpresa === "TODAS" || item.empresa === filtroEmpresa;

    const coincideSucursal =
      filtroSucursal === "TODAS" || item.sucursal === filtroSucursal;

    // Filtro por rango de fechas de ingreso
    let coincideFecha = true;
    if (item.fecha_ingreso) {
      const fechaIngresoStr = item.fecha_ingreso.split('T')[0];
      if (filtroFechaDesde && fechaIngresoStr < filtroFechaDesde) {
        coincideFecha = false;
      }
      if (filtroFechaHasta && fechaIngresoStr > filtroFechaHasta) {
        coincideFecha = false;
      }
    } else if (filtroFechaDesde || filtroFechaHasta) {
      coincideFecha = false;
    }

    return coincideColaborador && coincidePuesto && coincideEmpresa && coincideSucursal && coincideFecha;
  });

  const limpiarFiltros = () => {
    setFiltroColaborador("");
    setFiltroPuesto("");
    setFiltroEmpresa("TODAS");
    setFiltroSucursal("TODAS");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
  };

  const exportarCSV = () => {
    if (ingresosFiltrados.length === 0) {
      setMensajeFeedback({
        tipo: "error",
        texto: "No hay datos para exportar con los filtros actuales.",
      });
      return;
    }

    const headers = ["Colaborador", "Teléfono", "Puesto", "Empresa", "Sucursal", "Fecha de Ingreso", "Observaciones"];
    const filas = ingresosFiltrados.map((item) => [
      `"${item.colaborador || ""}"`,
      `"${item.telefono || ""}"`,
      `"${item.puesto || ""}"`,
      `"${item.empresa || ""}"`,
      `"${item.sucursal || ""}"`,
      `"${item.fecha_ingreso ? item.fecha_ingreso.split('T')[0] : ""}"`,
      `"${(item.observaciones || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...filas.map(e => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_ingresos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Cargando registros de ingresos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-600" />
            Control de Ingresos
          </h1>
          <p className="text-sm text-slate-500">
            Listado histórico de candidatos que han ingresado oficialmente a la empresa.
          </p>
        </div>

        <button
          onClick={exportarCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors self-start sm:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Reporte CSV
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
            <Filter className="w-4 h-4 text-emerald-600" />
            Panel de Búsqueda Específica
          </div>
          <button
            onClick={limpiarFiltros}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              COLABORADOR
            </label>
            <input
              type="text"
              placeholder="Nombre o Tel..."
              value={filtroColaborador}
              onChange={(e) => setFiltroColaborador(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              PUESTO
            </label>
            <input
              type="text"
              placeholder="Ej: Analista..."
              value={filtroPuesto}
              onChange={(e) => setFiltroPuesto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
              {empresasDisponibles.map((emp, index) => (
                <option key={`emp-${index}`} value={emp}>
                  {emp}
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
              {sucursalesDisponibles.map((suc, index) => (
                <option key={`suc-${index}`} value={suc}>
                  {suc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              DESDE (FECHA)
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              HASTA (FECHA)
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Colaborador</th>
                <th className="p-4">Puesto Vacante</th>
                <th className="p-4">Empresa / Sucursal</th>
                <th className="p-4">Fecha de Ingreso</th>
                <th className="p-4">Observaciones</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {ingresosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                    {ingresos.length === 0
                      ? 'No hay ingresos registrados todavía. Marca una postulación como "Aprobado" para registrar uno.'
                      : "No se encontraron ingresos con los filtros seleccionados."}
                  </td>
                </tr>
              ) : (
                ingresosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">
                        {item.colaborador}
                      </div>
                      <div className="text-xs text-slate-500">
                        Tel: {item.telefono || "—"}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-blue-600 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        {item.puesto}
                      </div>
                    </td>

                    <td className="p-4 text-xs text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {item.empresa || "—"}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.sucursal || "—"}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-100">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.fecha_ingreso ? new Date(item.fecha_ingreso + (item.fecha_ingreso.includes('T') ? '' : 'T00:00:00')).toLocaleDateString() : "—"}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-slate-600 max-w-xs truncate">
                      {item.observaciones ? (
                        <span className="flex items-start gap-1" title={item.observaciones}>
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{item.observaciones}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin observaciones</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          if (onVerDetalle) {
                            onVerDetalle(item.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}