import React, { useState, useEffect, useCallback } from 'react';
import { isApiMode, API_URL, load } from '../data/db';
import { AuthSession } from '../data/auth';
import { formatPrice } from '../utils/formatters';
import { Building2, BadgeCheck, XCircle, Clock, Link2, RefreshCw } from 'lucide-react';

interface SellerRow {
  id: string;
  email: string;
  full_name: string;
  seller_status: 'pending' | 'approved' | 'rejected' | null;
  seller_rejected_reason?: string | null;
  store_name?: string | null;
  cuit?: string | null;
  business_name?: string | null;
  contact_person?: string | null;
  whatsapp?: string | null;
  mp_user_id?: string | null;
  approved_at?: string | null;
}

/**
 * Panel Admin → Vendedores: aprueba o rechaza solicitudes de tiendas y ve
 * qué vendedores tienen Mercado Pago conectado (split de pagos activo).
 */
export const SellersApprovalPanel: React.FC = () => {
  const [rows, setRows] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!isApiMode) return;
    const session = load<AuthSession | null>('solooutlet_auth_session', null);
    try {
      const res = await fetch(`${API_URL}/admin/sellers`, { headers: { Authorization: `Bearer ${session?.token ?? ''}` } });
      if (res.ok) setRows(await res.json());
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const review = async (userId: string, approve: boolean, reason?: string) => {
    const session = load<AuthSession | null>('solooutlet_auth_session', null);
    await fetch(`${API_URL}/admin/sellers/${userId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token ?? ''}` },
      body: JSON.stringify({ approve, reason }),
    });
    setRejecting(null);
    void refresh();
  };

  if (!isApiMode) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
        <p className="font-bold text-slate-900 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Aprobación de vendedores</p>
        <p className="mt-2 text-xs">Disponible en modo producción (con base de datos conectada vía <code className="font-mono">VITE_API_URL</code>). En modo demo todas las tiendas se apruean al instante.</p>
      </div>
    );
  }

  const pending = rows.filter((r) => r.seller_status === 'pending');
  const approved = rows.filter((r) => r.seller_status === 'approved');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" /> Solicitudes y tiendas de vendedores
        </h3>
        <button onClick={() => void refresh()} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 py-6 text-center">Cargando…</div>
      ) : (
        <>
          {/* Pendientes de aprobación */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pendientes de aprobación ({pending.length})
            </h4>
            {pending.length === 0 ? (
              <p className="text-xs text-amber-700/70 mt-2">No hay solicitudes pendientes.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {pending.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-amber-200 p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{s.store_name || s.full_name}</div>
                        <div className="text-[11px] text-slate-500">{s.full_name} · {s.email} · CUIT {s.cuit || '—'} · WhatsApp {s.whatsapp || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void review(s.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" /> Aprobar
                        </button>
                        <button
                          onClick={() => setRejecting({ id: s.id, reason: '' })}
                          className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 cursor-pointer inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      </div>
                    </div>
                    {rejecting?.id === s.id && (
                      <div className="mt-2.5 flex gap-2">
                        <input
                          autoFocus
                          value={rejecting.reason}
                          onChange={(e) => setRejecting({ id: s.id, reason: e.target.value })}
                          placeholder="Motivo del rechazo (se le comunica al vendedor)"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                        />
                        <button onClick={() => void review(s.id, false, rejecting.reason)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer">
                          Confirmar rechazo
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aprobadas + estado MP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tiendas aprobadas ({approved.length})</h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b text-slate-400 uppercase text-[10px]">
                    <th className="pb-2">Tienda</th>
                    <th className="pb-2">Contacto</th>
                    <th className="pb-2">Mercado Pago (split)</th>
                    <th className="pb-2">Aprobada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approved.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 font-bold text-slate-900">{s.store_name || '—'}</td>
                      <td className="py-2.5 text-slate-500">{s.email}</td>
                      <td className="py-2.5">
                        {s.mp_user_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><Link2 className="w-3.5 h-3.5" /> Conectada ({s.mp_user_id})</span>
                        ) : (
                          <span className="text-slate-400">Sin conectar</span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-500">{s.approved_at ? new Date(s.approved_at).toLocaleDateString('es-AR') : '—'}</td>
                    </tr>
                  ))}
                  {approved.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-400">Aún no hay tiendas aprobadas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
