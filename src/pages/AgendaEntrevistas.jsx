import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, User, Briefcase,
  Video, MapPin, Phone, ExternalLink, FileText, X, Loader2, Search
} from "lucide-react";
import { getEntrevistasPorRango } from "../lib/api/entrevistas";
import { supabase } from "../lib/supabaseClient";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const inicioDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const finDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const sumarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const inicioSemana = d => { const x = inicioDia(d); const day = x.getDay() || 7; return sumarDias(x, 1 - day); };
const finSemana = d => finDia(sumarDias(inicioSemana(d), 6));
const inicioMes = d => new Date(d.getFullYear(), d.getMonth(), 1);
const finMes = d => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const isoLocal = d => {
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const mismoDia = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const hora = f => new Date(f).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const fechaLarga = f => new Date(f).toLocaleDateString("es-AR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

function estadoClase(estado) {
  if (estado === "Aprobado" || estado === "Realizada") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (estado === "Descartado") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function Evento({ entrevista, compacto=false, onClick }) {
  const p = entrevista.postulacion;
  const nombre = `${p?.candidato?.nombre || ""} ${p?.candidato?.apellido || ""}`.trim() || "Candidato";
  return (
    <button onClick={() => onClick(entrevista)} className={`w-full text-left border rounded-lg transition-colors hover:brightness-[0.98] ${estadoClase(entrevista.estado)} ${compacto ? "px-2 py-1.5" : "p-3"}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-bold shrink-0">{hora(entrevista.fecha)}</span>
        <span className="text-xs font-semibold text-slate-800 truncate">{nombre}</span>
      </div>
      {!compacto && <>
        <div className="text-[11px] text-slate-600 truncate mt-1">{p?.busqueda?.puesto?.nombre || "Puesto no especificado"}</div>
        <div className="text-[10px] text-slate-500 truncate mt-1">{entrevista.entrevistador || "Sin entrevistador"} · {entrevista.modalidad || "—"}</div>
      </>}
    </button>
  );
}

function DetalleEntrevista({ entrevista, onClose }) {
  if (!entrevista) return null;
  const p = entrevista.postulacion;
  const c = p?.candidato;
  const b = p?.busqueda;
  const nombre = `${c?.nombre || ""} ${c?.apellido || ""}`.trim() || "Candidato";
  const ModalidadIcon = entrevista.modalidad === "Videollamada" ? Video : entrevista.modalidad === "Telefonica" ? Phone : MapPin;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4" onMouseDown={onClose}>
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onMouseDown={e=>e.stopPropagation()}>
      <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-600"/> Detalle de Entrevista</h2>
          <p className="text-xs text-slate-500 mt-1">Consulta de agenda · Solo lectura</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5"/></button>
      </div>
      <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h3 className="text-xl font-bold text-slate-900">{nombre}</h3><p className="text-sm text-slate-500 mt-0.5">{b?.puesto?.nombre || "Puesto no especificado"}</p></div>
          <span className={`self-start text-xs font-semibold px-3 py-1.5 rounded-full border ${estadoClase(entrevista.estado)}`}>{entrevista.estado || "Pendiente"}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info icon={CalendarDays} titulo="Fecha" valor={fechaLarga(entrevista.fecha)} />
          <Info icon={Clock} titulo="Hora" valor={hora(entrevista.fecha)} />
          <Info icon={User} titulo="Entrevistador/a" valor={entrevista.entrevistador || "No especificado"} />
          <Info icon={ModalidadIcon} titulo="Modalidad" valor={entrevista.modalidad || "No especificada"} />
          <Info icon={Briefcase} titulo="Búsqueda" valor={b?.puesto?.nombre || "No especificada"} />
          <Info icon={Briefcase} titulo="Empresa" valor={b?.empresa?.nombre || "No especificada"} />
          <Info icon={MapPin} titulo="Sucursal" valor={b?.sucursal?.nombre || "No especificada"} />
        </div>
        {c?.cv_url && <a href={c.cv_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-3 py-2"><FileText className="w-4 h-4"/> Ver CV del candidato <ExternalLink className="w-3.5 h-3.5"/></a>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Texto titulo="Conocimiento y experiencia" valor={entrevista.conocimiento_experiencia}/>
          <Texto titulo="Evaluación" valor={entrevista.evaluacion}/>
        </div>
        {entrevista.motivo_descarte && <Texto titulo="Motivo de descarte" valor={entrevista.motivo_descarte} alerta/>}
        <Texto titulo="Observaciones" valor={entrevista.observaciones}/>
      </div>
      <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end"><button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg">Cerrar</button></div>
    </div>
  </div>;
}
function Info({icon:Icon,titulo,valor}) { return <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60"><div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5"/>{titulo}</div><div className="text-sm font-medium text-slate-700 mt-1 capitalize">{valor}</div></div> }
function Texto({titulo,valor,alerta=false}) { return <div className={`rounded-xl border p-3 ${alerta ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-200"}`}><div className={`text-[10px] uppercase tracking-wider font-bold ${alerta ? "text-red-500" : "text-slate-400"}`}>{titulo}</div><p className={`text-sm mt-1 whitespace-pre-wrap ${alerta ? "text-red-700" : "text-slate-600"}`}>{valor || "Sin información registrada."}</p></div> }

export default function AgendaEntrevistas() {
  const [vista, setVista] = useState("semana");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [entrevistas, setEntrevistas] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [entrevistador, setEntrevistador] = useState("todos");
  const [refreshKey, setRefreshKey] = useState(0);
  const [diaMesSeleccionado, setDiaMesSeleccionado] = useState(null);

  const rango = useMemo(() => {
    if (vista === "dia") return [inicioDia(fechaActual), finDia(fechaActual)];
    if (vista === "semana") return [inicioSemana(fechaActual), finSemana(fechaActual)];
    const ini = inicioSemana(inicioMes(fechaActual));
    const fin = finSemana(finMes(fechaActual));
    return [ini, fin];
  }, [vista, fechaActual]);

  useEffect(() => { let activo=true; (async()=>{ try { setLoading(true); setError(""); const data=await getEntrevistasPorRango(isoLocal(rango[0]), isoLocal(rango[1])); if(activo)setEntrevistas(data||[]); } catch(e){ if(activo)setError(e.message); } finally { if(activo)setLoading(false); } })(); return()=>{activo=false}; }, [rango[0].getTime(), rango[1].getTime(), refreshKey]);

  // Mantiene la agenda sincronizada si otra persona crea, edita o elimina una entrevista.
  useEffect(() => {
    const canal = supabase
      .channel("agenda-entrevistas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "entrevista" }, () => {
        setRefreshKey(k => k + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  const entrevistadores = useMemo(() => Array.from(new Set(
    entrevistas.map(e => e.entrevistador?.trim()).filter(Boolean)
  )).sort((a,b) => a.localeCompare(b, "es")), [entrevistas]);

  useEffect(() => {
    if (entrevistador !== "todos" && !entrevistadores.includes(entrevistador)) setEntrevistador("todos");
  }, [entrevistador, entrevistadores]);

  const visibles = entrevistas.filter(e => {
    if (entrevistador !== "todos" && e.entrevistador?.trim() !== entrevistador) return false;
    const q=filtro.trim().toLowerCase();
    if(!q)return true;
    const p=e.postulacion;
    return `${p?.candidato?.nombre||""} ${p?.candidato?.apellido||""} ${p?.busqueda?.puesto?.nombre||""} ${e.entrevistador||""}`.toLowerCase().includes(q);
  });
  const mover = dir => { const d=new Date(fechaActual); if(vista==="dia") d.setDate(d.getDate()+dir); else if(vista==="semana") d.setDate(d.getDate()+7*dir); else d.setMonth(d.getMonth()+dir); setFechaActual(d); };
  const titulo = vista === "dia" ? fechaActual.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : vista === "semana" ? `${rango[0].getDate()} ${MESES[rango[0].getMonth()]} — ${rango[1].getDate()} ${MESES[rango[1].getMonth()]} ${rango[1].getFullYear()}` : `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;

  return <div className="space-y-5">
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-slate-900">Agenda de Entrevistas</h1><p className="text-sm text-slate-500 mt-1">Programación y trazabilidad de las entrevistas del equipo.</p></div>
      <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
        <div className="relative w-full sm:w-64">
          <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <select value={entrevistador} onChange={e=>setEntrevistador(e.target.value)} className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none">
            <option value="todos">Todos los entrevistadores</option>
            {entrevistadores.map(nombre=><option key={nombre} value={nombre}>{nombre}</option>)}
          </select>
        </div>
        <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/><input value={filtro} onChange={e=>setFiltro(e.target.value)} placeholder="Candidato o puesto..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"/></div>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2"><button onClick={()=>mover(-1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronLeft className="w-4 h-4"/></button><button onClick={()=>setFechaActual(new Date())} className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50">Hoy</button><button onClick={()=>mover(1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronRight className="w-4 h-4"/></button><h2 className="ml-2 text-sm sm:text-base font-bold text-slate-800 capitalize">{titulo}</h2></div>
        <div className="inline-flex bg-slate-100 p-1 rounded-lg self-start lg:self-auto">{[["dia","Día"],["semana","Semana"],["mes","Mes"]].map(([id,label])=><button key={id} onClick={()=>setVista(id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${vista===id?"bg-white text-blue-600 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>{label}</button>)}</div>
      </div>
      {error && <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">No se pudo cargar la agenda: {error}</div>}
      {loading ? <div className="h-72 flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="w-5 h-5 animate-spin text-blue-600"/> Cargando entrevistas...</div> : vista === "mes" ? <VistaMes fecha={fechaActual} entrevistas={visibles} onClick={setSeleccionada} onVerDia={setDiaMesSeleccionado}/> : vista === "semana" ? <VistaSemana inicio={rango[0]} entrevistas={visibles} onClick={setSeleccionada}/> : <VistaDia fecha={fechaActual} entrevistas={visibles} onClick={setSeleccionada}/>} 
    </div>
    <DetalleDia fecha={diaMesSeleccionado} entrevistas={visibles} onClose={()=>setDiaMesSeleccionado(null)} onEntrevista={(e)=>{setDiaMesSeleccionado(null); setSeleccionada(e);}}/>
    <DetalleEntrevista entrevista={seleccionada} onClose={()=>setSeleccionada(null)}/>
  </div>;
}

function VistaMes({fecha,entrevistas,onClick,onVerDia}) { const ini=inicioSemana(inicioMes(fecha)); const dias=Array.from({length:42},(_,i)=>sumarDias(ini,i)); return <div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">{DIAS.map(d=><div key={d} className="p-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">{d}</div>)}</div><div className="grid grid-cols-7">{dias.map((d,i)=>{const esMes=d.getMonth()===fecha.getMonth(); const ev=entrevistas.filter(e=>mismoDia(new Date(e.fecha),d)); return <div key={i} className={`min-h-28 p-2 border-b border-r border-slate-100 ${esMes?"bg-white":"bg-slate-50/60"}`}><div className={`text-xs font-semibold mb-2 ${mismoDia(d,new Date())?"w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white":esMes?"text-slate-700":"text-slate-300"}`}>{d.getDate()}</div><div className="space-y-1">{ev.slice(0,3).map(e=><Evento key={e.id} entrevista={e} compacto onClick={onClick}/>)}{ev.length>3&&<button type="button" onClick={()=>onVerDia(d)} className="w-full text-left text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded px-1.5 py-1 font-semibold transition-colors">+ {ev.length-3} más</button>}</div></div>})}</div></div></div> }

function DetalleDia({fecha,entrevistas,onClose,onEntrevista}) { if(!fecha)return null; const ev=entrevistas.filter(e=>mismoDia(new Date(e.fecha),fecha)).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)); return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4" onMouseDown={onClose}><div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col" onMouseDown={e=>e.stopPropagation()}><div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-800">Entrevistas del día</h2><p className="text-xs text-slate-500 mt-1 capitalize">{fecha.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · {ev.length} entrevista{ev.length===1?"":"s"}</p></div><button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5"/></button></div><div className="p-4 overflow-y-auto space-y-2">{ev.map(e=><Evento key={e.id} entrevista={e} onClick={onEntrevista}/>)}</div><div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end"><button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg">Cerrar</button></div></div></div> }
function VistaSemana({inicio,entrevistas,onClick}) { const dias=Array.from({length:7},(_,i)=>sumarDias(inicio,i)); return <div className="overflow-x-auto"><div className="min-w-[900px]"><div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">{dias.map((d,i)=><div key={i} className="p-3 text-center border-r border-slate-100"><div className="text-[10px] font-bold uppercase text-slate-400">{DIAS[i]}</div><div className={`mx-auto mt-1 text-sm font-bold ${mismoDia(d,new Date())?"bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center":"text-slate-700"}`}>{d.getDate()}</div></div>)}</div><div className="grid grid-cols-7 min-h-[420px]">{dias.map((d,i)=>{const ev=entrevistas.filter(e=>mismoDia(new Date(e.fecha),d)); return <div key={i} className="p-2 border-r border-slate-100 space-y-2">{ev.length?ev.map(e=><Evento key={e.id} entrevista={e} onClick={onClick}/>):<div className="text-[10px] text-slate-300 text-center pt-6">Sin entrevistas</div>}</div>})}</div></div></div> }
function VistaDia({fecha,entrevistas,onClick}) { const ev=entrevistas.filter(e=>mismoDia(new Date(e.fecha),fecha)); return <div className="p-4 sm:p-6 min-h-[360px]">{ev.length===0?<div className="h-64 flex flex-col items-center justify-center text-slate-400"><CalendarDays className="w-9 h-9 mb-2 text-slate-300"/><p className="text-sm font-medium">No hay entrevistas programadas para este día.</p></div>:<div className="max-w-3xl mx-auto space-y-3">{ev.map(e=><div key={e.id} className="flex gap-3"><div className="w-14 pt-3 text-xs font-bold text-slate-500 text-right shrink-0">{hora(e.fecha)}</div><div className="flex-1"><Evento entrevista={e} onClick={onClick}/></div></div>)}</div>}</div> }
