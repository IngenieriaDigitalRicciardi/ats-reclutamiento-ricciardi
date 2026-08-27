import React, { useState } from "react";
import { useAuth } from "./lib/AuthContext";
import Layout from "./components/Layout";
import Catalogos from "./pages/Catalogos";
import Busquedas from "./pages/Busquedas";
import NuevaBusqueda from "./pages/NuevaBusqueda";
import DetalleBusqueda from "./pages/DetalleBusqueda";
import Postulaciones from "./pages/Postulaciones";
import NuevaPostulacion from "./pages/NuevaPostulacion";
import Candidatos from "./pages/Candidatos";
import NuevoCandidato from "./pages/NuevoCandidato";
import Ingresos from "./pages/Ingresos";
import IngresoDetalle from "./pages/IngresoDetalle";
import Login from "./pages/Login";
import { Loader2 } from "lucide-react";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { session, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState("vacantes");

  // Estados para alternar entre lista, alta, edición o detalle en cada sección
  const [vistaVacante, setVistaVacante] = useState("lista"); // 'lista', 'nueva', 'detalle'
  const [busquedaSeleccionadaId, setBusquedaSeleccionadaId] = useState(null);

  const [vistaPostulacion, setVistaPostulacion] = useState("lista");

  // Estados específicos para la gestión de Candidatos
  const [vistaCandidato, setVistaCandidato] = useState("lista");
  const [candidatoIdEdicion, setCandidatoIdEdicion] = useState(null);

  // Estados específicos para la gestión de Ingresos y su Detalle
  const [vistaIngreso, setVistaIngreso] = useState("lista"); // 'lista', 'detalle'
  const [ingresoSeleccionadoId, setIngresoSeleccionadoId] = useState(null);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Cargando sesión...</span>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={(tab) => {
        setCurrentTab(tab);
        // Al cambiar de pestaña principal, reseteamos las vistas internas a 'lista'
        if (tab === "vacantes") {
          setVistaVacante("lista");
          setBusquedaSeleccionadaId(null);
        }
        if (tab === "postulaciones") setVistaPostulacion("lista");
        if (tab === "candidatos") {
          setVistaCandidato("lista");
          setCandidatoIdEdicion(null);
        }
        if (tab === "ingresos") {
          setVistaIngreso("lista");
          setIngresoSeleccionadoId(null);
        }
      }}
    >
      {/* Pestaña Vacantes y Empleos */}
      {currentTab === "vacantes" && (
        <>
          {vistaVacante === "lista" && (
            <Busquedas
              onCrearNueva={() => setVistaVacante("nueva")}
              onVerDetalleBusqueda={(id) => {
                setBusquedaSeleccionadaId(id);
                setVistaVacante("detalle");
              }}
            />
          )}
          {vistaVacante === "nueva" && (
            <NuevaBusqueda onVolver={() => setVistaVacante("lista")} />
          )}
          {vistaVacante === "detalle" && (
            <DetalleBusqueda
              busquedaId={busquedaSeleccionadaId}
              onVolver={() => {
                setBusquedaSeleccionadaId(null);
                setVistaVacante("lista");
              }}
            />
          )}
        </>
      )}

      {/* Pestaña Candidatos / CVs */}
      {currentTab === "candidatos" && (
        <>
          {vistaCandidato === "lista" && (
            <Candidatos
              onNuevoCandidato={() => {
                setCandidatoIdEdicion(null);
                setVistaCandidato("nuevo");
              }}
              onEditarCandidato={(id) => {
                setCandidatoIdEdicion(id);
                setVistaCandidato("editar");
              }}
            />
          )}
          {(vistaCandidato === "nuevo" || vistaCandidato === "editar") && (
            <NuevoCandidato
              candidatoId={candidatoIdEdicion}
              onVolver={() => {
                setCandidatoIdEdicion(null);
                setVistaCandidato("lista");
              }}
            />
          )}
        </>
      )}

      {/* Pestaña Postulaciones */}
      {currentTab === "postulaciones" && (
        <>
          {vistaPostulacion === "lista" && (
            <Postulaciones
              onNuevaPostulacion={() => setVistaPostulacion("nueva")}
              onVerDetalleBusqueda={(idBusqueda) => {
                setBusquedaSeleccionadaId(idBusqueda);
                setCurrentTab("vacantes");
                setVistaVacante("detalle");
              }}
            />
          )}
          {vistaPostulacion === "nueva" && (
            <NuevaPostulacion onVolver={() => setVistaPostulacion("lista")} />
          )}
        </>
      )}

      {/* Pestaña Ingresos */}
      {currentTab === "ingresos" && (
        <>
          {vistaIngreso === "lista" && (
            <Ingresos 
              onVerDetalle={(idIngreso) => {
                setIngresoSeleccionadoId(idIngreso);
                setVistaIngreso("detalle");
              }} 
            />
          )}
          {vistaIngreso === "detalle" && (
            <IngresoDetalle 
              ingresoId={ingresoSeleccionadoId}
              onVolver={() => {
                setIngresoSeleccionadoId(null);
                setVistaIngreso("lista");
              }}
              onVerBusqueda={(idBusqueda) => {
                setBusquedaSeleccionadaId(idBusqueda);
                setCurrentTab("vacantes");
                setVistaVacante("detalle");
              }}
            />
          )}
        </>
      )}

      {/* Resto de las pestañas */}
      {currentTab === "catalogos" && <Catalogos />}
      {currentTab === "dashboard" && <Dashboard />}
    </Layout>
  );
}