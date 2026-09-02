import React, { useEffect, useState, useMemo } from 'react';
import { 
  Building, 
  MapPin, 
  Briefcase, 
  Plus, 
  Trash2, 
  Building2, 
  Loader2, 
  AlertCircle,
  Search,
  Filter,
  X,
  Sparkles,
  Inbox
} from 'lucide-react';

import {
  getEmpresas, createEmpresa, deleteEmpresa,
  getSucursales, createSucursal, deleteSucursal,
  getDepartamentos,
  getPuestos, createPuesto, deletePuesto,
} from '../lib/api/catalogos';

export default function Catalogos() {
  const [activeTab, setActiveTab] = useState('empresas');

  // Data States
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos, setPuestos] = useState([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresaId, setFilterEmpresaId] = useState('ALL');
  const [filterDeptId, setFilterDeptId] = useState('ALL');

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Unified Form State
  const [formData, setFormData] = useState({
    empresaNombre: '',
    sucursalNombre: '',
    sucursalEmpresaId: '',
    puestoNombre: '',
    puestoDeptId: ''
  });

  const cargarTodo = async () => {
    setLoading(true);
    setError(null);
    try {
      const [emp, suc, dep, pue] = await Promise.all([
        getEmpresas(),
        getSucursales(),
        getDepartamentos(),
        getPuestos()
      ]);
      setEmpresas(emp || []);
      setSucursales(suc || []);
      setDepartamentos(dep || []);
      setPuestos(pue || []);

      setFormData(prev => ({
        ...prev,
        sucursalEmpresaId: prev.sucursalEmpresaId || (emp?.[0]?.id ?? ''),
        puestoDeptId: prev.puestoDeptId || (dep?.[0]?.id ?? '')
      }));
    } catch (err) {
      setError(err.message || 'Error al cargar los catálogos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilterEmpresaId('ALL');
    setFilterDeptId('ALL');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(prev => ({
      ...prev,
      empresaNombre: '',
      sucursalNombre: '',
      puestoNombre: ''
    }));
  };

  // --- MEMOIZED FILTERS ---
  const empresasFiltradas = useMemo(() => {
    return empresas.filter(e => 
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [empresas, searchTerm]);

  const sucursalesFiltradas = useMemo(() => {
    return sucursales.filter(s => {
      const matchSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.empresa?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEmpresa = filterEmpresaId === 'ALL' || s.empresa_id === filterEmpresaId || s.empresa?.id === filterEmpresaId;
      return matchSearch && matchEmpresa;
    });
  }, [sucursales, searchTerm, filterEmpresaId]);

  const puestosFiltrados = useMemo(() => {
    return puestos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.departamento?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = filterDeptId === 'ALL' || p.departamento_id === filterDeptId || p.departamento?.id === filterDeptId;
      return matchSearch && matchDept;
    });
  }, [puestos, searchTerm, filterDeptId]);

  // --- SUBMISSION HANDLERS ---
  const handleAddEmpresa = async (e) => {
    e.preventDefault();
    if (!formData.empresaNombre.trim()) return;
    setSubmitting(true);
    try {
      await createEmpresa(formData.empresaNombre.trim());
      closeModal();
      await cargarTodo();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleAddSucursal = async (e) => {
    e.preventDefault();
    if (!formData.sucursalNombre.trim() || !formData.sucursalEmpresaId) return;
    setSubmitting(true);
    try {
      await createSucursal(formData.sucursalEmpresaId, formData.sucursalNombre.trim());
      closeModal();
      await cargarTodo();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleAddPuesto = async (e) => {
    e.preventDefault();
    if (!formData.puestoNombre.trim() || !formData.puestoDeptId) return;
    setSubmitting(true);
    try {
      await createPuesto(formData.puestoDeptId, formData.puestoNombre.trim());
      closeModal();
      await cargarTodo();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (fn, id, label) => {
    if (!window.confirm(`¿Estás seguro de eliminar este registro de ${label}?`)) return;
    try {
      await fn(id);
      await cargarTodo();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Gestión de Catálogos</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Configuración y parametrización de la estructura organizacional.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'empresas' && 'Nueva Empresa'}
          {activeTab === 'sucursales' && 'Nueva Sucursal'}
          {activeTab === 'puestos' && 'Nuevo Puesto'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 space-x-6 px-1">
        {[
          { id: 'empresas', label: 'Empresas', icon: Building, count: empresas.length },
          { id: 'sucursales', label: 'Sucursales', icon: MapPin, count: sucursales.length },
          { id: 'puestos', label: 'Puestos', icon: Briefcase, count: puestos.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Buscar en ${activeTab}...`}
            className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {activeTab === 'sucursales' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={filterEmpresaId}
                onChange={(e) => setFilterEmpresaId(e.target.value)}
                className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
              >
                <option value="ALL">Todas las Empresas</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'puestos' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={filterDeptId}
                onChange={(e) => setFilterDeptId(e.target.value)}
                className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
              >
                <option value="ALL">Todos los Departamentos</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {(searchTerm || filterEmpresaId !== 'ALL' || filterDeptId !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterEmpresaId('ALL'); setFilterDeptId('ALL'); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-500">Cargando catálogos...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          {activeTab === 'empresas' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-6">Nombre de la Empresa</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empresasFiltradas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-xs border border-blue-100">
                          {emp.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        {emp.nombre}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleDelete(deleteEmpresa, emp.id, 'empresa')} className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {empresasFiltradas.length === 0 && (
                    <tr><td colSpan="2" className="py-12 text-center"><EmptyState label="empresas" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sucursales' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-6">Sucursal / Sede</th>
                    <th className="py-3.5 px-6">Empresa Perteneciente</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sucursalesFiltradas.map((suc) => (
                    <tr key={suc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800">{suc.nombre}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100/80 text-slate-700 border border-slate-200/60">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {suc.empresa?.nombre || 'Sin empresa asignada'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleDelete(deleteSucursal, suc.id, 'sucursal')} className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sucursalesFiltradas.length === 0 && (
                    <tr><td colSpan="3" className="py-12 text-center"><EmptyState label="sucursales" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'puestos' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-6">Puesto / Cargo</th>
                    <th className="py-3.5 px-6">Departamento</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {puestosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800">{p.nombre}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {p.departamento?.nombre || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleDelete(deletePuesto, p.id, 'puesto')} className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {puestosFiltrados.length === 0 && (
                    <tr><td colSpan="3" className="py-12 text-center"><EmptyState label="puestos" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Container */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-base text-slate-900">
                {activeTab === 'empresas' && 'Nueva Empresa'}
                {activeTab === 'sucursales' && 'Nueva Sucursal'}
                {activeTab === 'puestos' && 'Nuevo Puesto'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Types */}
            {activeTab === 'empresas' && (
              <form onSubmit={handleAddEmpresa} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={formData.empresaNombre}
                    onChange={(e) => setFormData({ ...formData, empresaNombre: e.target.value })}
                    placeholder="Ej. Ricciardi Logistics"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    autoFocus
                  />
                </div>
                <ModalFooter onClose={closeModal} submitting={submitting} disabled={!formData.empresaNombre.trim()} />
              </form>
            )}

            {activeTab === 'sucursales' && (
              <form onSubmit={handleAddSucursal} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Empresa Perteneciente</label>
                  <select
                    value={formData.sucursalEmpresaId}
                    onChange={(e) => setFormData({ ...formData, sucursalEmpresaId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all text-slate-800"
                  >
                    <option value="" disabled>Seleccionar Empresa</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nombre de la Sucursal</label>
                  <input
                    type="text"
                    value={formData.sucursalNombre}
                    onChange={(e) => setFormData({ ...formData, sucursalNombre: e.target.value })}
                    placeholder="Ej. Sede Rosario"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
                <ModalFooter onClose={closeModal} submitting={submitting} disabled={!formData.sucursalNombre.trim() || !formData.sucursalEmpresaId} />
              </form>
            )}

            {activeTab === 'puestos' && (
              <form onSubmit={handleAddPuesto} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Departamento</label>
                  <select
                    value={formData.puestoDeptId}
                    onChange={(e) => setFormData({ ...formData, puestoDeptId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all text-slate-800"
                  >
                    <option value="" disabled>Seleccionar Departamento</option>
                    {departamentos.map((d) => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nombre del Puesto / Cargo</label>
                  <input
                    type="text"
                    value={formData.puestoNombre}
                    onChange={(e) => setFormData({ ...formData, puestoNombre: e.target.value })}
                    placeholder="Ej. Analista de Reclutamiento"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
                <ModalFooter onClose={closeModal} submitting={submitting} disabled={!formData.puestoNombre.trim() || !formData.puestoDeptId} />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Small UI Helper Components
function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Inbox className="w-8 h-8 text-slate-300" />
      <p className="text-sm text-slate-500 font-medium">No se encontraron {label}.</p>
    </div>
  );
}

function ModalFooter({ onClose, submitting, disabled }) {
  return (
    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
      <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={submitting || disabled} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Guardar
      </button>
    </div>
  );
}