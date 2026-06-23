import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDevices, createDevice, deleteDevice } from '../api/devices';
import type { Device, ZoneType } from '../types';
import ApiKeyModal from '../components/ApiKeyModal';
import Pagination from '../components/Pagination';

const ZONE_LABELS: Record<ZoneType, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  invernadero: 'Invernadero',
  bodega: 'Bodega',
};

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, page_size: 10, has_next: false });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    tipo_zona: 'interior' as ZoneType,
    latitud: '',
    longitud: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getDevices(page, 10);
      setDevices(res.data.data);
      setMeta(res.data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await createDevice({
        nombre: form.nombre,
        tipo_zona: form.tipo_zona,
        latitud: form.latitud ? parseFloat(form.latitud) : null,
        longitud: form.longitud ? parseFloat(form.longitud) : null,
      });
      setApiKey(res.data.data.api_key);
      setShowForm(false);
      setForm({ nombre: '', tipo_zona: 'interior', latitud: '', longitud: '' });
      load(meta.page);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este dispositivo? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      await deleteDevice(id);
      load(meta.page);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {apiKey && <ApiKeyModal apiKey={apiKey} onClose={() => setApiKey(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dispositivos</h1>
          <p className="text-slate-500 mt-1">Gestiona tus nodos ESP32</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-lg font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: '#3fae3a' }}
        >
          + Nuevo dispositivo
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">Nuevo dispositivo</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 text-slate-800"
                  placeholder="Ej: Sensor Invernadero A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de zona</label>
                <select
                  value={form.tipo_zona}
                  onChange={(e) => setForm({ ...form, tipo_zona: e.target.value as ZoneType })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 text-slate-800"
                >
                  {Object.entries(ZONE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitud</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitud}
                    onChange={(e) => setForm({ ...form, latitud: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 text-slate-800"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitud}
                    onChange={(e) => setForm({ ...form, longitud: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 text-slate-800"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-white transition disabled:opacity-70"
                  style={{ backgroundColor: '#3fae3a' }}
                >
                  {formLoading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Cargando...</div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <p>No hay dispositivos registrados.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Creado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <Link to={`/devices/${d.id}`} className="font-medium text-slate-800 hover:underline" style={{ textDecorationColor: '#3fae3a' }}>
                      {d.nombre}
                    </Link>
                    <div className="text-xs text-slate-400 font-mono">#{d.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">{ZONE_LABELS[d.tipo_zona]}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${d.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.activo ? '#3fae3a' : '#94a3b8' }} />
                      {d.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                    {new Date(d.created_at).toLocaleDateString('es')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/devices/${d.id}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      >
                        Ver detalle
                      </Link>
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={deleting === d.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deleting === d.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={meta.page}
        hasNext={meta.has_next}
        total={meta.total}
        pageSize={meta.page_size}
        onPage={load}
      />
    </div>
  );
}
