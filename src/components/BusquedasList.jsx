import React, { useState, useEffect } from 'react';
import { getBusquedas, updateEstadoBusqueda } from '../services/busquedasService';
import { NuevaBusquedaModal } from './modals/NuevaBusquedaModal';

export const BusquedasList = () => {
  const [busquedas, setBusquedas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBusquedas = async () => {
    setLoading(true);
    try {
      const data = await getBusquedas();
      setBusquedas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusquedas();
  }, []);

  const handleEstadoChange = async (id, estado) => {
    try {
      await updateEstadoBusqueda(id, estado);
      await fetchBusquedas();
    } catch (err) {
      alert('Error cambiando estado de la búsqueda.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Búsquedas Laborales</h1>
          <p className="text-sm text-slate-500">Gestión de vacantes activas y pausadas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
        >
          + Nueva Búsqueda
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Cargando búsquedas...</p>
      ) : (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="p-4">Puesto / Depto</th>
                <th className="p-4">Empresa</th>
                <th className="p-4">Sucursal</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {busquedas.map((b) => (
                <tr key={b.ID} className="hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{b.PUESTO?.NOMBRE}</p>
                    <p className="text-xs text-slate-400">{b.PUESTO?.DEPARTAMENTO?.NOMBRE}</p>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{b.EMPRESA?.NOMBRE}</td>
                  <td className="p-4 text-slate-600">{b.SUCURSAL?.NOMBRE}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        b.estado === 'Abierta'
                          ? 'bg-emerald-100 text-emerald-700'
                          : b.estado === 'Pausada'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.estado}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {b.estado === 'Abierta' && (
                      <button
                        onClick={() => handleEstadoChange(b.ID, 'Pausada')}
                        className="text-xs text-amber-600 hover:underline"
                      >
                        Pausar
                      </button>
                    )}
                    {b.estado === 'Pausada' && (
                      <button
                        onClick={() => handleEstadoChange(b.ID, 'Abierta')}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        Reabrir
                      </button>
                    )}
                    {b.estado !== 'Cerrada' && (
                      <button
                        onClick={() => handleEstadoChange(b.ID, 'Cerrada')}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Cerrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NuevaBusquedaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBusquedas}
      />
    </div>
  );
};