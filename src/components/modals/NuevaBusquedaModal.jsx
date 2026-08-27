import React, { useState, useEffect } from 'react';
import { getEmpresas, getSucursalesByEmpresa, getDepartamentos, getPuestosByDepartamento } from '../../services/catalogosService';
import { createBusqueda } from '../../services/busquedasService';

export const NuevaBusquedaModal = ({ isOpen, onClose, onSuccess }) => {
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos, setPuestos] = useState([]);

  const [formData, setFormData] = useState({
    idEmpresa: '',
    idSucursal: '',
    idDepartamento: '',
    idPuesto: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [empData, deptData] = await Promise.all([
        getEmpresas(),
        getDepartamentos()
      ]);
      setEmpresas(empData);
      setDepartamentos(deptData);
    } catch (err) {
      console.error('Error cargando catálogos iniciales:', err);
    }
  };

  const handleEmpresaChange = async (empresaId) => {
    setFormData((prev) => ({ ...prev, idEmpresa: empresaId, idSucursal: '' }));
    if (!empresaId) {
      setSucursales([]);
      return;
    }
    const data = await getSucursalesByEmpresa(empresaId);
    setSucursales(data);
  };

  const handleDepartamentoChange = async (deptId) => {
    setFormData((prev) => ({ ...prev, idDepartamento: deptId, idPuesto: '' }));
    if (!deptId) {
      setPuestos([]);
      return;
    }
    const data = await getPuestosByDepartamento(deptId);
    setPuestos(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idEmpresa || !formData.idSucursal || !formData.idPuesto) return;

    setLoading(true);
    try {
      await createBusqueda({
        idEmpresa: formData.idEmpresa,
        idSucursal: formData.idSucursal,
        idPuesto: formData.idPuesto
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Error al crear la búsqueda laboral.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Nueva Búsqueda Laboral</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Empresa</label>
            <select
              value={formData.idEmpresa}
              onChange={(e) => handleEmpresaChange(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Seleccionar Empresa --</option>
              {empresas.map((e) => (
                <option key={e.ID} value={e.ID}>{e.NOMBRE}</option>
              ))}
            </select>
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Sucursal</label>
            <select
              value={formData.idSucursal}
              onChange={(e) => setFormData({ ...formData, idSucursal: e.target.value })}
              disabled={!formData.idEmpresa}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              required
            >
              <option value="">-- Seleccionar Sucursal --</option>
              {sucursales.map((s) => (
                <option key={s.ID} value={s.ID}>{s.NOMBRE}</option>
              ))}
            </select>
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Departamento</label>
            <select
              value={formData.idDepartamento}
              onChange={(e) => handleDepartamentoChange(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Seleccionar Departamento --</option>
              {departamentos.map((d) => (
                <option key={d.ID} value={d.ID}>{d.NOMBRE}</option>
              ))}
            </select>
          </div>

          {/* Puesto */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Puesto Solicitado</label>
            <select
              value={formData.idPuesto}
              onChange={(e) => setFormData({ ...formData, idPuesto: e.target.value })}
              disabled={!formData.idDepartamento}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              required
            >
              <option value="">-- Seleccionar Puesto --</option>
              {puestos.map((p) => (
                <option key={p.ID} value={p.ID}>{p.NOMBRE}</option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creando...' : 'Abrir Búsqueda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};