import React, { useState, useEffect } from 'react'
import { getDashboardData } from '../lib/api/dashboard'
import { 
  Briefcase, 
  Users, 
  UserCheck, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Loader2,
  PieChart as PieIcon,
  TrendingUp,
  FileText,
  Filter,
  RotateCcw
} from 'lucide-react'
import { 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e']

export default function Dashboard() {
  const anioActual = new Date().getFullYear()

  // Estados de filtros por fecha (Por defecto: Año actual completo)
  const [fechaInicio, setFechaInicio] = useState(`${anioActual}-01-01`)
  const [fechaFin, setFechaFin] = useState(`${anioActual}-12-31`)

  const [loading, setLoading] = useState(true)
  const [datos, setDatos] = useState({
    busquedas: [],
    postulaciones: [],
    entrevistas: [],
    totalCandidatos: 0
  })
  const [error, setError] = useState(null)

  const cargarDatos = async (inicio, fin) => {
    try {
      setLoading(true)
      const resultado = await getDashboardData(inicio, fin)
      setDatos(resultado)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos(fechaInicio, fechaFin)
  }, [])

  const aplicarFiltros = (e) => {
    e.preventDefault()
    cargarDatos(fechaInicio, fechaFin)
  }

  const reiniciarFiltros = () => {
    const inicio = `${anioActual}-01-01`
    const fin = `${anioActual}-12-31`
    setFechaInicio(inicio)
    setFechaFin(fin)
    cargarDatos(inicio, fin)
  }

  if (loading && datos.postulaciones.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span>Cargando métricas del dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        Error al cargar el dashboard: {error}
      </div>
    )
  }

  // --- CÁLCULOS DE KPIs Y MÉTRICAS ---
  const busquedasAbiertas = datos.busquedas.filter(b => b.estado === 'Abierta').length
  const totalPostulaciones = datos.postulaciones.length

  const ingresaron = datos.postulaciones.filter(p => p.embudo_estado === 'Aprobado').length
  const noAplican = datos.postulaciones.filter(p => p.embudo_estado === 'Descartado').length
  const noAceptaOferta = datos.postulaciones.filter(p => p.embudo_estado === 'No acepta oferta' || p.embudo_estado === 'Rechazo oferta').length
  const sinRespuesta = datos.postulaciones.filter(p => p.embudo_estado === 'Sin respuesta').length
  
  const enProcesoActivo = datos.postulaciones.filter(p => 
    ['Postulado', 'En Revision', 'Entrevistado', 'Oferta'].includes(p.embudo_estado)
  ).length

  const totalCandidatosReporte = datos.totalCandidatos > 0 ? datos.totalCandidatos : totalPostulaciones
  
  const tasaSeleccion = totalCandidatosReporte > 0 
    ? ((ingresaron / totalCandidatosReporte) * 100).toFixed(2) 
    : 0

  // 1. Gráfico de torta de Embudo
  const conteoEmbudo = datos.postulaciones.reduce((acc, p) => {
    const estado = p.embudo_estado || 'Sin definir'
    acc[estado] = (acc[estado] || 0) + 1
    return acc
  }, {})

  const datosEmbudo = Object.keys(conteoEmbudo).map(key => ({
    name: key,
    value: conteoEmbudo[key],
    porcentaje: totalPostulaciones > 0 ? ((conteoEmbudo[key] / totalPostulaciones) * 100).toFixed(1) : 0
  }))

  // 2. Gráfico de torta de Búsquedas por Empresa
  const totalBusquedas = datos.busquedas.length
  const conteoEmpresas = datos.busquedas.reduce((acc, b) => {
    const empresaNombre = b.empresa?.nombre || 'Sin empresa'
    acc[empresaNombre] = (acc[empresaNombre] || 0) + 1
    return acc
  }, {})

  const datosEmpresas = Object.keys(conteoEmpresas).map(key => ({
    name: key,
    value: conteoEmpresas[key],
    porcentaje: totalBusquedas > 0 ? ((conteoEmpresas[key] / totalBusquedas) * 100).toFixed(1) : 0
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Encabezado y Filtro por Fechas */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard de Reclutamiento</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Métricas y reporte oficial de rendimiento filtrado por periodo.</p>
        </div>

        {/* Barra de Filtros de Fecha */}
        <form onSubmit={aplicarFiltros} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Desde:</span>
            </span>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-auto"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs text-slate-600 font-medium">
            <span>Hasta:</span>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <button 
              type="submit"
              className="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm text-center"
            >
              Filtrar
            </button>

            <button 
              type="button"
              onClick={reiniciarFiltros}
              title="Restablecer al año actual"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Indicador de Tasa de Selección */}
      <div className="flex justify-start sm:justify-end">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-semibold border border-blue-100 w-full sm:w-auto justify-center sm:justify-start">
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>Tasa de Selección en periodo: {tasaSeleccion}%</span>
        </div>
      </div>

      {/* 1. Tarjetas de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Búsquedas Abiertas</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{busquedasAbiertas}</h3>
            <span className="text-xs text-slate-500">De {totalBusquedas} en el periodo</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Candidatos</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalCandidatosReporte}</h3>
            <span className="text-xs text-slate-500">Registrados</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ingresos (Aprobados)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{ingresaron}</h3>
            <span className="text-xs text-slate-500">Contrataciones</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Entrevistas</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{datos.entrevistas.length}</h3>
            <span className="text-xs text-slate-500">En el periodo</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. REPORTE GENERAL POR PERIODO */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Resultados Generales del Periodo Seleccionado</h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-lg self-start sm:self-auto">
            {fechaInicio} al {fechaFin}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-500">Entrevistados</p>
            <p className="text-lg sm:text-xl font-bold text-slate-800 mt-1">{datos.entrevistas.length}</p>
          </div>
          <div className="bg-emerald-50/60 p-3.5 sm:p-4 rounded-xl border border-emerald-100 text-center">
            <p className="text-xs font-semibold text-emerald-700">Ingresaron</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-800 mt-1">{ingresaron}</p>
          </div>
          <div className="bg-red-50/60 p-3.5 sm:p-4 rounded-xl border border-red-100 text-center">
            <p className="text-xs font-semibold text-red-700">No aplican</p>
            <p className="text-lg sm:text-xl font-bold text-red-800 mt-1">{noAplican}</p>
          </div>
          <div className="bg-amber-50/60 p-3.5 sm:p-4 rounded-xl border border-amber-100 text-center">
            <p className="text-xs font-semibold text-amber-700">No acepta oferta</p>
            <p className="text-lg sm:text-xl font-bold text-amber-800 mt-1">{noAceptaOferta}</p>
          </div>
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100 text-center">
            <p className="text-xs font-semibold text-slate-500">Sin respuesta</p>
            <p className="text-lg sm:text-xl font-bold text-slate-800 mt-1">{sinRespuesta}</p>
          </div>
          <div className="bg-blue-50/60 p-3.5 sm:p-4 rounded-xl border border-blue-100 text-center col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-blue-700">En proceso activo</p>
            <p className="text-lg sm:text-xl font-bold text-blue-800 mt-1">{enProcesoActivo}</p>
          </div>
        </div>
      </div>

      {/* 3. Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-blue-600 shrink-0" />
            Postulaciones por Etapa (Embudo %)
          </h3>
          <div className="h-72 sm:h-80 w-full">
            {datosEmbudo.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No hay registros en este periodo.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datosEmbudo} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}>
                    {datosEmbudo.map((entry, index) => (
                      <Cell key={`cell-emb-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} registros (${props.payload.porcentaje}%)`, "Cantidad"]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            Distribución de Búsquedas por Empresa (%)
          </h3>
          <div className="h-72 sm:h-80 w-full">
            {datosEmpresas.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No hay búsquedas en este periodo.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datosEmpresas} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}>
                    {datosEmpresas.map((entry, index) => (
                      <Cell key={`cell-emp-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} búsquedas (${props.payload.porcentaje}%)`, "Total"]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}