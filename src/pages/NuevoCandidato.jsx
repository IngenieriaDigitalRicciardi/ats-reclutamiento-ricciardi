import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { crearCandidato, actualizarCandidato, getCandidatoById } from '../lib/api/candidatos';
import AlertBanner from '../components/ui/alertbanner';
import { validarCandidato } from '../utils/validaciones';
import { ArrowLeft, Save, Loader2, User, Phone, Mail, Link as LinkIcon, MapPin, CreditCard, Globe, Search } from 'lucide-react';

export default function NuevoCandidato({ candidatoId = null, onVolver }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    ciudad: '',
    id_fuente: '', 
    cv_url: '',
  });

  const [fuentes, setFuentes] = useState([]);
  const [sugerenciasCiudades, setSugerenciasCiudades] = useState([]);
  const [buscandoCiudad, setBuscandoCiudad] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});

  const esEdicion = Boolean(candidatoId);

  useEffect(() => {
    cargarFuentes();
  }, []);

  async function cargarFuentes() {
    try {
      const { data, error } = await supabase
        .from('fuente_reclutamiento')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) setFuentes(data);
    } catch (error) {
      console.error('Error al cargar fuentes de reclutamiento:', error);
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = formData.ciudad.trim();
    
    if (query.length < 2) {
      setSugerenciasCiudades([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setBuscandoCiudad(true);
        const response = await fetch(`https://apis.datos.gob.ar/georef/api/v2.0/localidades?nombre=${encodeURIComponent(query)}&max=10`);
        const data = await response.json();
        
        if (data && data.localidades) {
          const resultados = data.localidades.map(loc => `${loc.nombre}, ${loc.provincia.nombre}`);
          setSugerenciasCiudades(resultados);
          setMostrarDropdown(true);
        }
      } catch (error) {
        console.error('Error buscando ciudades:', error);
      } finally {
        setBuscandoCiudad(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.ciudad]);

  useEffect(() => {
    if (esEdicion) {
      cargarCandidato();
    }
  }, [candidatoId]);

  async function cargarCandidato() {
    try {
      setLoadingDatos(true);
      const data = await getCandidatoById(candidatoId);
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni || '',
          telefono: data.telefono || '',
          email: data.email || '',
          ciudad: data.ciudad || '',
          id_fuente: data.id_fuente ? String(data.id_fuente) : '', 
          cv_url: data.cv_url || '',
        });
      }
    } catch (error) {
      setMensajeFeedback({ tipo: 'error', texto: 'Error al cargar el candidato: ' + error.message });
    } finally {
      setLoadingDatos(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const seleccionarCiudad = (ciudadSeleccionada) => {
    setFormData(prev => ({ ...prev, ciudad: ciudadSeleccionada }));
    setSugerenciasCiudades([]);
    setMostrarDropdown(false);
    setErroresCampos(prev => ({ ...prev, ciudad: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeFeedback(null);

    const validacion = validarCandidato(formData);

    if (!validacion.esValido) {
      setErroresCampos(validacion.errores);
      setMensajeFeedback({ tipo: 'error', texto: 'Por favor, completa los campos obligatorios y revisa los errores.' });
      return;
    }

    setErroresCampos({});

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        id_fuente: Number(formData.id_fuente)
      };

      if (esEdicion) {
        await actualizarCandidato(candidatoId, payload);
        setMensajeFeedback({ tipo: 'success', texto: 'Candidato actualizado con éxito.' });
      } else {
        await crearCandidato(payload);
        setMensajeFeedback({ tipo: 'success', texto: 'Candidato registrado con éxito.' });
        setFormData({ nombre: '', apellido: '', dni: '', telefono: '', email: '', ciudad: '', id_fuente: '', cv_url: '' });
      }
      
      setTimeout(() => {
        if (onVolver) onVolver();
      }, 1200);

    } catch (error) {
      if (error.code === '23505' || (error.message && error.message.includes('candidato_telefono_key'))) {
        setErroresCampos(prev => ({ ...prev, telefono: 'Este número de teléfono ya se encuentra registrado.' }));
        setMensajeFeedback({ 
          tipo: 'error', 
          texto: 'Ya existe un candidato registrado con este número de teléfono.' 
        });
      } else {
        setMensajeFeedback({ tipo: 'error', texto: 'Error al guardar: ' + error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingDatos) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Cargando datos del candidato...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </button>
        <h1 className="text-xl font-bold text-slate-800">
          {esEdicion ? 'Editar Candidato' : 'Nuevo Candidato'}
        </h1>
      </div>

      <AlertBanner 
        tipo={mensajeFeedback?.tipo} 
        texto={mensajeFeedback?.texto} 
        onClose={() => setMensajeFeedback(null)} 
      />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="nombre"
                placeholder="Ej: María"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erroresCampos.nombre ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {erroresCampos.nombre && <span className="text-[11px] text-red-500 mt-1 block">{erroresCampos.nombre}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Apellido *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="apellido"
                placeholder="Ej: Gómez"
                value={formData.apellido}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erroresCampos.apellido ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {erroresCampos.apellido && <span className="text-[11px] text-red-500 mt-1 block">{erroresCampos.apellido}</span>}
          </div>
        </div>

        {/* DNI y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">DNI (Opcional)</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="dni"
                placeholder="Ej: 35123456"
                value={formData.dni}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Teléfono / Celular *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="telefono"
                placeholder="Ej: 1123456789"
                value={formData.telefono}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erroresCampos.telefono ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {erroresCampos.telefono && <span className="text-[11px] text-red-500 mt-1 block">{erroresCampos.telefono}</span>}
          </div>
        </div>

        {/* Email y Ciudad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Correo Electrónico (Opcional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="Ej: maria@email.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erroresCampos.email ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {erroresCampos.email && <span className="text-[11px] text-red-500 mt-1 block">{erroresCampos.email}</span>}
          </div>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ciudad *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="ciudad"
                placeholder="Escribe para buscar (ej: Mercedes)..."
                value={formData.ciudad}
                onChange={handleChange}
                onFocus={() => { if (sugerenciasCiudades.length > 0) setMostrarDropdown(true); }}
                className={`w-full pl-9 pr-9 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erroresCampos.ciudad ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {buscandoCiudad ? (
                <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              )}
            </div>
            {erroresCampos.ciudad && <span className="text-[11px] text-red-500 mt-1 block">{erroresCampos.ciudad}</span>}

            {mostrarDropdown && sugerenciasCiudades.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {sugerenciasCiudades.map((ciudadItem, index) => (
                  <li
                    key={index}
                    onClick={() => seleccionarCiudad(ciudadItem)}
                    className="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                  >
                    {ciudadItem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Fuente y Link CV */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fuente de reclutamiento *</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                name="id_fuente"
                value={formData.id_fuente}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                  erroresCampos.id_fuente ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              >
                <option value="">Selecciona una fuente...</option>
                {fuentes.map((fuente) => (
                  <option key={fuente.id} value={fuente.id}>
                    {fuente.nombre}
                  </option>
                ))}
              </select>
            </div>
            {erroresCampos.id_fuente && <span className="text-[11px] text-red-500 mt-1 block">{erroresCampos.id_fuente}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Link del CV (Opcional)</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="url"
                name="cv_url"
                placeholder="https://drive.google.com/..."
                value={formData.cv_url}
                onChange={handleChange}
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erroresCampos.cv_url ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {erroresCampos.cv_url && <span className="text-[11px] text-red-500 mt-1 block">{erroresCampos.cv_url}</span>}
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onVolver}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {esEdicion ? 'Actualizar Candidato' : 'Guardar Candidato'}
          </button>
        </div>

      </form>
    </div>
  );
}