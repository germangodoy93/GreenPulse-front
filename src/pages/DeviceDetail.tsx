import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { getDevice, updateDevice, rotateApiKey } from '../api/devices';
import { getReadings, getLatestReading, getAggregate } from '../api/readings';
import { getThresholds, upsertThresholds } from '../api/thresholds';
import type { Device, Reading, ThresholdConfig, AggregateResult, SensorField, ZoneType } from '../types';
import ApiKeyModal from '../components/ApiKeyModal';

const FIELDS: { key: SensorField; label: string; unit: string }[] = [
  { key: 'temperature', label: 'Temperatura', unit: '°C' },
  { key: 'air_humidity', label: 'Humedad del aire', unit: '%' },
  { key: 'soil_humidity', label: 'Humedad del suelo', unit: '%' },
  { key: 'pressure', label: 'Presión', unit: 'hPa' },
  { key: 'altitude', label: 'Altitud', unit: 'm' },
  { key: 'light_lux', label: 'Luz', unit: 'lux' },
  { key: 'water_level', label: 'Nivel de agua', unit: 'cm' },
];

const ZONE_OPTIONS: ZoneType[] = ['interior', 'exterior', 'invernadero', 'bodega'];

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deviceId = Number(id);

  const [device, setDevice] = useState<Device | null>(null);
  const [latest, setLatest] = useState<Reading | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdConfig | null>(null);
  const [aggregate, setAggregate] = useState<AggregateResult | null>(null);
  const [activeField, setActiveField] = useState<SensorField>('temperature');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', tipo_zona: 'interior' as ZoneType });
  const [thresholdForm, setThresholdForm] = useState<Partial<ThresholdConfig>>({});
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [tab, setTab] = useState<'readings' | 'thresholds'>('readings');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [devRes, latestRes, readRes, thrRes] = await Promise.all([
        getDevice(deviceId),
        getLatestReading(deviceId),
        getReadings({ device_id: deviceId, page: 1, page_size: 50 }),
        getThresholds(deviceId),
      ]);
      setDevice(devRes.data.data);
      setEditForm({ nombre: devRes.data.data.nombre, tipo_zona: devRes.data.data.tipo_zona });
      setLatest(latestRes.data.data);
      setReadings(readRes.data.data.reverse());
      setThresholds(thrRes.data.data);
      setThresholdForm(thrRes.data.data);
    } catch {
      // device may not exist
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const loadAggregate = useCallback(async () => {
    try {
      const res = await getAggregate(deviceId, activeField);
      setAggregate(res.data.data);
    } catch {
      setAggregate(null);
    }
  }, [deviceId, activeField]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAggregate(); }, [loadAggregate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;
    await updateDevice(deviceId, editForm);
    setEditMode(false);
    load();
  };

  const handleRotateKey = async () => {
    if (!confirm('¿Rotar la API key? La clave anterior dejará de funcionar.')) return;
    const res = await rotateApiKey(deviceId);
    setApiKey(res.data.data.api_key);
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingThresholds(true);
    try {
      await upsertThresholds(deviceId, thresholdForm);
      load();
    } finally {
      setSavingThresholds(false);
    }
  };

  const chartData = readings.map((r) => ({
    time: new Date(r.recorded_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    value: r[activeField],
  }));

  const thresholdMin = thresholds ? (thresholds[`${activeField}_min` as keyof ThresholdConfig] as number | null) : null;
  const thresholdMax = thresholds ? (thresholds[`${activeField}_max` as keyof ThresholdConfig] as number | null) : null;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Cargando...</div>;
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500">Dispositivo no encontrado.</p>
        <button onClick={() => navigate('/devices')} className="text-sm font-medium" style={{ color: '#3fae3a' }}>
          ← Volver a dispositivos
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {apiKey && <ApiKeyModal apiKey={apiKey} onClose={() => setApiKey(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 md:mb-8">
        <div>
          <button onClick={() => navigate('/devices')} className="text-sm mb-2 flex items-center gap-1" style={{ color: '#3fae3a' }}>
            ← Dispositivos
          </button>
          {editMode ? (
            <form onSubmit={handleUpdate} className="flex items-center gap-3">
              <input
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                className="text-2xl font-bold border-b-2 border-slate-300 focus:border-green-500 outline-none bg-transparent text-slate-800"
              />
              <select
                value={editForm.tipo_zona}
                onChange={(e) => setEditForm({ ...editForm, tipo_zona: e.target.value as ZoneType })}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700"
              >
                {ZONE_OPTIONS.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#3fae3a' }}>
                Guardar
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600">
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{device.nombre}</h1>
              <span className="text-sm text-slate-400 capitalize border border-slate-200 px-2 py-0.5 rounded-full">{device.tipo_zona}</span>
              <button onClick={() => setEditMode(true)} className="text-xs text-slate-400 hover:text-slate-600 transition">✎ Editar</button>
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${device.activo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {device.activo ? 'Activo' : 'Inactivo'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {device.id}</span>
          </div>
        </div>
        <button
          onClick={handleRotateKey}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          🔄 Rotar API key
        </button>
      </div>

      {/* Latest reading cards */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {FIELDS.filter((f) => latest[f.key] !== null).map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveField(f.key)}
              className={`text-left bg-white rounded-xl p-4 shadow-sm border transition ${activeField === f.key ? 'border-green-400 ring-2 ring-green-100' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <div className="text-xs text-slate-500 mb-1">{f.label}</div>
              <div className="text-2xl font-bold font-mono text-slate-800">
                {latest[f.key]?.toFixed(1)}
                <span className="text-sm font-normal text-slate-400 ml-1">{f.unit}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('readings')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === 'readings' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Lecturas
        </button>
        <button
          onClick={() => setTab('thresholds')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === 'thresholds' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Umbrales
        </button>
      </div>

      {tab === 'readings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {/* Field selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FIELDS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveField(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeField === f.key ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={activeField === f.key ? { backgroundColor: '#3fae3a' } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Aggregate stats */}
          {aggregate && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
              {[
                { label: 'Mínimo', val: aggregate.min },
                { label: 'Máximo', val: aggregate.max },
                { label: 'Promedio', val: aggregate.avg },
                { label: 'Lecturas', val: aggregate.count },
              ].map(({ label, val }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {typeof val === 'number' ? val.toFixed(1) : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400">Sin lecturas disponibles</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'IBM Plex Mono', fontSize: 12 }}
                  formatter={(val) => [(val as number)?.toFixed(2), FIELDS.find((f) => f.key === activeField)?.label]}
                />
                {thresholdMin !== null && (
                  <ReferenceLine y={thresholdMin} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Mín', fill: '#f97316', fontSize: 10 }} />
                )}
                {thresholdMax !== null && (
                  <ReferenceLine y={thresholdMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Máx', fill: '#ef4444', fontSize: 10 }} />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3fae3a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3fae3a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {tab === 'thresholds' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <p className="text-sm text-slate-500 mb-6">
            Define los valores mínimos y máximos aceptables para cada sensor. Se generarán alertas cuando una lectura esté fuera de estos rangos.
          </p>
          <form onSubmit={handleSaveThresholds} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <div className="text-sm font-semibold text-slate-700">{f.label} ({f.unit})</div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 mb-1 block">Mínimo</label>
                    <input
                      type="number"
                      step="any"
                      value={(thresholdForm as Record<string, unknown>)[`${f.key}_min`] as string ?? ''}
                      onChange={(e) =>
                        setThresholdForm({
                          ...thresholdForm,
                          [`${f.key}_min`]: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2"
                      placeholder="—"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 mb-1 block">Máximo</label>
                    <input
                      type="number"
                      step="any"
                      value={(thresholdForm as Record<string, unknown>)[`${f.key}_max`] as string ?? ''}
                      onChange={(e) =>
                        setThresholdForm({
                          ...thresholdForm,
                          [`${f.key}_max`]: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 focus:outline-none focus:ring-2"
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingThresholds}
                className="px-6 py-2.5 rounded-lg font-semibold text-white transition disabled:opacity-70"
                style={{ backgroundColor: '#3fae3a' }}
              >
                {savingThresholds ? 'Guardando...' : 'Guardar umbrales'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
