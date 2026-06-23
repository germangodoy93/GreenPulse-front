import { useEffect, useState, useCallback } from 'react';
import { getAlerts, resolveAlert } from '../api/alerts';
import type { Alert, SeverityLevel } from '../types';
import SeverityBadge from '../components/SeverityBadge';
import Pagination from '../components/Pagination';

const SEVERITY_OPTIONS: Array<SeverityLevel | ''> = ['', 'low', 'medium', 'high', 'critical'];

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, page_size: 15, has_next: false });
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [filterResolved, setFilterResolved] = useState<boolean | undefined>(false);
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | ''>('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAlerts({
        page,
        page_size: 15,
        resuelta: filterResolved,
        ...(filterSeverity && { severity: filterSeverity }),
      });
      setAlerts(res.data.data);
      setMeta(res.data.meta);
    } finally {
      setLoading(false);
    }
  }, [filterResolved, filterSeverity]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: number) => {
    setResolving(id);
    try {
      await resolveAlert(id);
      load(meta.page);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Alertas</h1>
        <p className="text-slate-500 mt-1">Monitoreo de umbrales y eventos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterResolved === undefined ? 'all' : filterResolved ? 'resolved' : 'unresolved'}
          onChange={(e) => {
            const v = e.target.value;
            setFilterResolved(v === 'all' ? undefined : v === 'resolved');
          }}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none"
        >
          <option value="unresolved">Sin resolver</option>
          <option value="resolved">Resueltas</option>
          <option value="all">Todas</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | '')}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none"
        >
          <option value="">Todas las severidades</option>
          {SEVERITY_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Cargando...</div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-3xl">✅</span>
            <p className="text-slate-500">No hay alertas con los filtros seleccionados.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sensor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dispositivo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Umbral</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severidad</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-800 capitalize">
                    {a.field.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">#{a.device_id}</td>
                  <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-700">{a.value}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                    {a.threshold_min !== null && <span>Min: {a.threshold_min} </span>}
                    {a.threshold_max !== null && <span>Max: {a.threshold_max}</span>}
                    {a.threshold_min === null && a.threshold_max === null && '—'}
                  </td>
                  <td className="px-6 py-4">
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                    {new Date(a.created_at).toLocaleString('es', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${a.resuelta ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                      {a.resuelta ? 'Resuelta' : 'Activa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!a.resuelta && (
                      <button
                        onClick={() => handleResolve(a.id)}
                        disabled={resolving === a.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border text-white transition disabled:opacity-50"
                        style={{ backgroundColor: '#3fae3a', borderColor: '#3fae3a' }}
                      >
                        {resolving === a.id ? '...' : 'Resolver'}
                      </button>
                    )}
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
