import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../api/devices';
import { getAlerts } from '../api/alerts';
import { getReadings } from '../api/readings';
import type { Device, Alert, Reading } from '../types';
import SeverityBadge from '../components/SeverityBadge';

const SENSOR_FIELDS: { key: keyof Reading; label: string; unit: string; color: string }[] = [
  { key: 'temperature',   label: 'Temperatura',     unit: '°C',   color: '#ef4444' },
  { key: 'air_humidity',  label: 'Hum. Aire',        unit: '%',    color: '#3b82f6' },
  { key: 'soil_humidity', label: 'Hum. Suelo',       unit: '%',    color: '#8b5cf6' },
  { key: 'pressure',      label: 'Presión',          unit: 'hPa',  color: '#f97316' },
  { key: 'altitude',      label: 'Altitud',          unit: 'm',    color: '#06b6d4' },
  { key: 'light_lux',     label: 'Luz',              unit: 'lux',  color: '#eab308' },
  { key: 'water_level',   label: 'Nivel agua',       unit: 'cm',   color: '#3fae3a' },
];

const REFRESH_INTERVAL = 15000;

export default function Dashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    try {
      const [readRes, devRes, alertRes] = await Promise.all([
        getReadings({ page: 1, page_size: 20 }),
        getDevices(1, 100),
        getAlerts({ resuelta: false, page: 1, page_size: 5 }),
      ]);
      setReadings(readRes.data.data ?? []);
      setDevices(devRes.data.data ?? []);
      setAlerts(alertRes.data.data ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  // Latest reading (first in list since API returns newest first)
  const latest = readings[0] ?? null;

  const activeDevices = devices.filter((d) => d.activo).length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitoreo en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Actualizado: {lastUpdated.toLocaleTimeString('es')}
            </span>
          )}
          <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs text-slate-400">
            Auto-refresh {REFRESH_INTERVAL / 1000}s
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500 mb-1">Dispositivos activos</div>
          <div className="text-3xl font-bold font-mono text-slate-800">{activeDevices}</div>
          <div className="text-xs text-slate-400 mt-1">{devices.length} registrados en total</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500 mb-1">Alertas activas</div>
          <div className="text-3xl font-bold font-mono" style={{ color: alerts.length > 0 ? '#f97316' : '#3fae3a' }}>
            {alerts.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">{criticalAlerts} críticas</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500 mb-1">Última lectura</div>
          <div className="text-xl font-bold font-mono text-slate-800">
            {latest ? new Date(latest.recorded_at).toLocaleTimeString('es') : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {latest ? `Dispositivo #${latest.device_id}` : 'Sin lecturas'}
          </div>
        </div>
      </div>

      {/* Live sensor cards */}
      {latest && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-slate-700 mb-4">Sensores — última lectura</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {SENSOR_FIELDS.filter((f) => latest[f.key] !== null).map((f) => {
              const val = latest[f.key] as number | null;
              return (
                <div key={f.key} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-500 mb-2">{f.label}</div>
                  <div className="text-2xl font-bold font-mono" style={{ color: f.color }}>
                    {val?.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{f.unit}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent readings table + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Readings feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Lecturas recientes</h2>
            <span className="text-xs text-slate-400 font-mono">{readings.length} registros</span>
          </div>
          {readings.length === 0 ? (
            <p className="text-sm text-slate-400">Sin lecturas disponibles.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 pr-3 font-semibold text-slate-500">Hora</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-500">Disp.</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-500">Temp °C</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-500">Hum %</th>
                    <th className="pb-2 pr-3 font-semibold text-slate-500">Pres hPa</th>
                    <th className="pb-2 font-semibold text-slate-500">Luz lux</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="py-2 pr-3 font-mono text-slate-500">
                        {new Date(r.recorded_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2 pr-3 font-mono text-slate-400">#{r.device_id}</td>
                      <td className="py-2 pr-3 font-mono font-semibold text-red-600">
                        {r.temperature?.toFixed(1) ?? '—'}
                      </td>
                      <td className="py-2 pr-3 font-mono font-semibold text-blue-600">
                        {r.air_humidity?.toFixed(1) ?? '—'}
                      </td>
                      <td className="py-2 pr-3 font-mono text-orange-600">
                        {r.pressure?.toFixed(0) ?? '—'}
                      </td>
                      <td className="py-2 font-mono text-yellow-600">
                        {r.light_lux?.toFixed(1) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800">Alertas activas</h2>
            <Link to="/alerts" className="text-sm font-medium hover:underline" style={{ color: '#3fae3a' }}>
              Ver todas
            </Link>
          </div>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <span className="text-2xl">✅</span>
              <p className="text-sm text-slate-400">Sin alertas activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-800 capitalize text-sm">
                      {a.field.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Valor: {a.value} · Disp. #{a.device_id}
                    </div>
                  </div>
                  <SeverityBadge severity={a.severity} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
