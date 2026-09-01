import React, { useState, useEffect } from "react";
import {
  getBusquedas,
  updateBusqueda,
  deleteBusqueda,
} from "../lib/api/busquedas";
import { getEmpresas, getSucursales, getPuestos } from "../lib/api/catalogos";
import {
  Search,
  Plus,
  Loader2,
  RotateCcw,
  Trash2,
  Users,
  Eye,
} from "lucide-react";

// Importamos los componentes reutilizables
import AlertBanner from "../components/ui/alertbanner";
import ConfirmModal from "../components/ui/confirmmodal";

export default function Busquedas({ onCrearNueva, onVerDetalleBusqueda }) {
  const [busquedas, setBusquedas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [puestos, setPuestos] = useState([]);

  const [busquedaTexto, setBusquedaTexto] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [busquedaAEliminar, setBusquedaAEliminar] = useState(null);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [busRes, empRes, sucRes, pueRes] = await Promise.all([
        getBusquedas(),
        getEmpresas(),
        getSucursales(),
        getPuestos(),
      ]);
      setBusquedas(busRes || []);
      setEmpresas(empRes || []);
      setSucursales(sucRes || []);
      setPuestos(pueRes || []);
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al cargar los datos: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await updateBusqueda(id, { estado: nuevoEstado });
      cargarDatos();
      setMensajeFeedback({
        tipo: "success",
        texto: "Estado actualizado correctamente.",
      });
    } catch (error) {
      setMensajeFeedback({
        tipo: "error",
        texto: "Error al actualizar estado: " + error.message,
      });
    }
  };

  const confirmarEliminar = async () => {
    if (!busquedaAEliminar) return;

    try {
      await deleteBusqueda(busquedaAEliminar.id);
      setBusquedas((prev) => prev.filter((b) => b.id !== busquedaAEliminar.id));
      setMensajeFeedback({
        tipo: "success",
        texto: `La búsqueda "${busquedaAEliminar.puesto?.nombre || "Seleccionada"}" fue eliminada con éxito.`,
      });
      setBusquedaAEliminar(null);
    } catch (error) {
      setBusquedaAEliminar(null);
      if (error.code === "23503" || error.message?.includes("foreign key")) {
        setMensajeFeedback({
          tipo: "error",
          texto: `No se puede eliminar la búsqueda porque tiene postulantes asociados. Te sugerimos cambiar su estado a "Cerrada".`,
        });
      } else {
        setMensajeFeedback({
          tipo: "error",
          texto: "Error al eliminar la búsqueda: " + error.message,
        });
      }
    }
  };

  const sucursalesFiltradasFiltro = sucursales.filter(
    (s) => !filtroEmpresa || String(s.id_empresa) === String(filtroEmpresa),
  );

  const limpiarFiltros = () => {
    setBusquedaTexto("");
    setFiltroEmpresa("");
    setFiltroSucursal("");
    setFiltroPuesto("");
    setFiltroEstado("Todas");
    setFechaDesde("");
    setFechaHasta("");
  };

  const busquedasFiltradas = busquedas.filter((b) => {
    const textoMatch =
      !busquedaTexto ||
      b.puesto?.nombre?.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
      b.empresa?.nombre?.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
      b.sucursal?.nombre?.toLowerCase().includes(busquedaTexto.toLowerCase());

    // Obtenemos los IDs tanto si vienen directos como si están dentro del objeto relacionado
    const empresaIdB = b.id_empresa || b.empresa?.id;
    const sucursalIdB = b.id_sucursal || b.sucursal?.id;
    const puestoIdB = b.id_puesto || b.puesto?.id;

    // Convertimos ambos a String para evitar conflictos entre números y strings del select
    const empresaMatch = !filtroEmpresa || String(empresaIdB) === String(filtroEmpresa);
    const sucursalMatch = !filtroSucursal || String(sucursalIdB) === String(filtroSucursal);
    const puestoMatch = !filtroPuesto || String(puestoIdB) === String(filtroPuesto);
    
    const estadoMatch = filtroEstado === "Todas" || b.estado === filtroEstado;

    let fechaMatch = true;
    if (b.created_at) {
      const fechaCreacion = b.created_at.split("T")[0];
      if (fechaDesde && fechaCreacion < fechaDesde) fechaMatch = false;
      if (fechaHasta && fechaCreacion > fechaHasta) fechaMatch = false;
    }

    return (
      textoMatch &&
      empresaMatch &&
      sucursalMatch &&
      puestoMatch &&
      estadoMatch &&
      fechaMatch
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <AlertBanner
        tipo={mensajeFeedback?.tipo}
        texto={mensajeFeedback?.texto}
        onClose={() => setMensajeFeedback(null)}
      />

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Búsquedas Laborales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona, filtra y supervisa todas las posiciones abiertas.
          </p>
        </div>
        <button
          onClick={onCrearNueva}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Búsqueda
        </button>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda por texto libre */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por puesto, empresa..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Filtro Empresa */}
          <div>
            <select
              value={filtroEmpresa}
              onChange={(e) => {
                setFiltroEmpresa(e.target.value);
                setFiltroSucursal(""); // Reseteamos sucursal al cambiar empresa
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Todas las empresas</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Sucursal */}
          <div>
            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Todas las sucursales</option>
              {sucursalesFiltradasFiltro.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Puesto */}
          <div>
            <select
              value={filtroPuesto}
              onChange={(e) => setFiltroPuesto(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Todos los puestos</option>
              {puestos.map((pue) => (
                <option key={pue.id} value={pue.id}>
                  {pue.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segunda línea de filtros (Estado y Fechas) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Estado:</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white"
              >
                <option value="Todas">Todas</option>
                <option value="Abierta">Abierta</option>
                <option value="Pausada">Pausada</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Desde:</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Hasta:</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={limpiarFiltros}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors self-end sm:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Contenido / Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Cargando búsquedas...</span>
          </div>
        ) : busquedasFiltradas.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="font-medium">
              No se encontraron búsquedas con los filtros seleccionados.
            </p>
            <button
              onClick={limpiarFiltros}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Limpiar filtros para ver todas
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Puesto / Área</th>
                  <th className="p-4">Empresa / Sucursal</th>
                  <th className="p-4">Postulantes</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {busquedasFiltradas.map((b) => {
                  const fechaFormateada = b.created_at
                    ? new Date(b.created_at).toLocaleDateString()
                    : "-";

                  const cantidadPostulantes = Array.isArray(b.postulaciones)
                    ? b.postulaciones.length
                    : Array.isArray(b.postulacion)
                      ? b.postulacion.length
                      : 0;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {fechaFormateada}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() =>
                            onVerDetalleBusqueda && onVerDetalleBusqueda(b.id)
                          }
                          className="font-semibold text-blue-600 hover:text-blue-800 text-left transition-colors cursor-pointer group"
                        >
                          {b.puesto?.nombre || "Sin puesto"}
                          <span className="block text-[11px] font-normal text-slate-500">
                            {b.puesto?.departamento?.nombre ||
                              "Sin departamento"}
                          </span>
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-800 font-medium">
                          {b.empresa?.nombre || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {b.sucursal?.nombre || "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {cantidadPostulantes} inscriptos
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={b.estado}
                          onChange={(e) =>
                            handleCambiarEstado(b.id, e.target.value)
                          }
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
                            b.estado === "Abierta"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : b.estado === "Pausada"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <option value="Abierta">Abierta</option>
                          <option value="Pausada">Pausada</option>
                          <option value="Cerrada">Cerrada</option>
                        </select>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() =>
                            onVerDetalleBusqueda && onVerDetalleBusqueda(b.id)
                          }
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-block"
                          title="Ver detalle completo y candidatos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBusquedaAEliminar(b)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors inline-block"
                          title="Eliminar búsqueda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(busquedaAEliminar)}
        title={`¿Eliminar búsqueda para "${busquedaAEliminar?.puesto?.nombre || "Seleccionado"}"?`}
        message="Si esta búsqueda ya cuenta con postulantes vinculados, el sistema rechazará la acción para proteger los datos históricos. En ese caso, te sugerimos cambiar su estado a 'Cerrada'."
        onConfirm={confirmarEliminar}
        onClose={() => setBusquedaAEliminar(null)}
        confirmText="Sí, eliminar"
      />
    </div>
  );
}