import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/formatters';
import { COMMISSION_CONFIG } from '../utils/commissions';
import { BadgeCheck, Building2, Landmark, Wallet, ArrowRight, Receipt } from 'lucide-react';

/**
 * Panel de Liquidaciones — SoloOutlet retiene la comisión y transfiere el neto.
 * - Cada venta genera un settlement automático (bruto / comisión / neto).
 * - El admin agrupa pendientes por vendedor → genera liquidación → marca transferido.
 * - El vendedor registra su CBU/alias para recibir la transferencia.
 */
export const PayoutsDashboard: React.FC = () => {
  const {
    orders, sellers, payouts,
    registerSellerAccount, requestSellerPayout, markPayoutTransferred,
    platformRetainedTotal,
  } = useStore();

  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [storeName, setStoreName] = useState('ElectroPlaza Outlet');

  const bySeller = useMemo(() => {
    const map = new Map<string, { gross: number; fee: number; net: number; count: number }>();
    for (const o of orders) {
      const name = o.sellerName || o.items?.[0]?.product?.vendor || '—';
      const e = map.get(name) || { gross: 0, fee: 0, net: 0, count: 0 };
      e.gross += o.settlement?.gross ?? o.total;
      e.fee += o.settlement?.platformFee ?? 0;
      if (o.payoutStatus === 'pendiente') e.net += o.settlement?.netPayout ?? 0;
      e.count += 1;
      map.set(name, e);
    }
    return [...map.entries()];
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Resumen plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Comisión retenida SoloOutlet ({Math.round(COMMISSION_CONFIG.rate * 100)}%)</div>
          <div className="text-2xl font-black tabular-nums mt-1">{formatPrice(platformRetainedTotal())}</div>
          <div className="text-[11px] text-slate-400 mt-1">Se retiene automáticamente en cada venta. No se transfiere al vendedor.</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Pendiente de transferir</div>
          <div className="text-2xl font-black tabular-nums mt-1">
            {formatPrice(orders.filter((o) => o.payoutStatus === 'pendiente').reduce((s, o) => s + (o.settlement?.netPayout ?? 0), 0))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Neto de vendedores (bruto − comisión − pasarela).</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Ya transferido</div>
          <div className="text-2xl font-black tabular-nums mt-1">
            {formatPrice(payouts.filter((p) => p.status === 'transferido').reduce((s, p) => s + p.netAmount, 0))}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">{payouts.length} liquidaciones generadas.</div>
        </div>
      </div>

      {/* Registrar cuenta bancaria del vendedor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold flex items-center gap-2"><Landmark className="w-4 h-4 text-blue-600" /> Cuenta para recibir transferencias</h3>
        <p className="text-xs text-slate-500 mt-1">El neto (venta − {Math.round(COMMISSION_CONFIG.rate * 100)}% comisión) se transfiere a esta cuenta.</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3">
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Comercio" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
          <input value={cbu} onChange={(e) => setCbu(e.target.value)} placeholder="CBU (22 dígitos)" className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono" />
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Alias" className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono" />
          <button onClick={() => registerSellerAccount(storeName, { cbu, alias })} className="px-3 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-700 cursor-pointer">Guardar cuenta</button>
        </div>
        {sellers.length > 0 && (
          <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-2">
            {sellers.map((s) => (
              <span key={s.id} className="px-2 py-1 bg-slate-100 rounded-lg font-mono">{s.storeName} · {s.alias || s.cbu || 'sin CBU'}</span>
            ))}
          </div>
        )}
      </div>

      {/* Por vendedor: retener comisión + transferir neto */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Liquidación por vendedor</h3>
        <p className="text-xs text-slate-500 mb-3">Flujo: venta → SoloOutlet retiene {Math.round(COMMISSION_CONFIG.rate * 100)}% → neto pendiente → generar liquidación → transferir.</p>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b text-slate-400 uppercase text-[10px]">
              <th className="pb-2">Vendedor</th>
              <th className="pb-2 text-right">Bruto</th>
              <th className="pb-2 text-right">Comisión retenida</th>
              <th className="pb-2 text-right">Neto a transferir</th>
              <th className="pb-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bySeller.map(([name, v]) => (
              <tr key={name}>
                <td className="py-2.5 font-bold">{name} <span className="text-slate-400 font-normal">({v.count})</span></td>
                <td className="py-2.5 text-right tabular-nums">{formatPrice(v.gross)}</td>
                <td className="py-2.5 text-right tabular-nums text-slate-500">−{formatPrice(v.fee)}</td>
                <td className="py-2.5 text-right tabular-nums font-bold text-emerald-700">{formatPrice(v.net)}</td>
                <td className="py-2.5 text-right">
                  <button
                    disabled={v.net <= 0}
                    onClick={() => requestSellerPayout(name)}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                  >
                    Generar liquidación <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historial de liquidaciones */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-blue-600" /> Historial de transferencias ({payouts.length})</h3>
        {payouts.length === 0 ? (
          <p className="text-xs text-slate-500">Todavía no hay liquidaciones. Generá una desde la tabla de arriba.</p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-[10px]">
                <th className="pb-2">ID</th>
                <th className="pb-2">Vendedor</th>
                <th className="pb-2">Órdenes</th>
                <th className="pb-2 text-right">Neto</th>
                <th className="pb-2 text-right">Estado</th>
                <th className="pb-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 font-mono text-blue-600 font-bold">{p.id}</td>
                  <td className="py-2.5 font-semibold">{p.sellerName}</td>
                  <td className="py-2.5 text-slate-500">{p.orderNumbers.join(', ')}</td>
                  <td className="py-2.5 text-right font-bold tabular-nums">{formatPrice(p.netAmount)}</td>
                  <td className="py-2.5 text-right">
                    {p.status === 'transferido'
                      ? <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Transferido {p.transferReceipt}</span>
                      : <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Pendiente</span>}
                  </td>
                  <td className="py-2.5 text-right">
                    {p.status === 'pendiente' && (
                      <button onClick={() => markPayoutTransferred(p.id)} className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer">
                        Marcar transferido
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
