import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/formatters';
import { canAccessModule, roleLabel, SELLER_ROLES, INTEGRATION_CATALOG, WorkspaceModule } from '../utils/sellerWorkspace';
import { SellerRole, Order } from '../types';
import {
  Store, Users, Megaphone, Plug, Wallet, Plus, Pause, Play,
  Trash2, Power, Lock, ArrowRight, BadgeCheck, Package,
  Truck, Minus, Edit2, Check, X, ShoppingBag, TrendingUp, BarChart3, ArrowUpRight, DollarSign,
} from 'lucide-react';

/**
 * Panel del vendedor (B2B): lo que vende, su stock, sus pedidos,
 * empleados por rol, publicidad e integraciones.
 * El comprador normal nunca entra acá: solo ve catálogo y sus pedidos.
 */

const NEXT_STATUS: Record<Order['status'], Order['status'] | null> = {
  en_preparacion: 'despachado',
  despachado: 'completado',
  completado: null,
  cancelado: null,
};

const STATUS_LABEL: Record<Order['status'], { label: string; cls: string }> = {
  en_preparacion: { label: 'En preparación', cls: 'bg-amber-100 text-amber-800' },
  despachado: { label: 'Despachado', cls: 'bg-blue-100 text-blue-700' },
  completado: { label: 'Entregado', cls: 'bg-emerald-100 text-emerald-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500' },
};

export const SellerWorkspace: React.FC = () => {
  const {
    sellers, activeSellerName, setActiveSellerName, mySellerRole,
    createSellerWorkspace, inviteMember, updateMemberRole, toggleMemberActive,
    removeMember, createAdCampaign, toggleAdCampaign, toggleIntegration,
    products, orders, updateOrderStatus, updateProductStock, updateProductPrice,
    deleteProduct, requestSellerPayout, payouts,
    currentUser, openAuthModal, setCurrentView,
  } = useStore();

  const [tab, setTab] = useState<WorkspaceModule>('resumen');
  const [newStore, setNewStore] = useState('');
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'ventas' as SellerRole });
  const [campForm, setCampForm] = useState({ name: '', budget: 10000, productIds: [] as string[] });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Sin tienda todavía ──
  if (sellers.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Creá tu tienda vendedora</h1>
        <p className="text-sm text-slate-500 mt-2">
          Publicá tu stock, gestioná pedidos, sumá empleados por rol, hacé publicidad y cobrá con liquidaciones automáticas.
        </p>
        {!currentUser ? (
          <button
            onClick={() => openAuthModal('merchant')}
            className="mt-6 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 cursor-pointer"
          >
            Registrar mi comercio
          </button>
        ) : (
          <div className="mt-6 flex gap-2 justify-center">
            <input
              value={newStore}
              onChange={(e) => setNewStore(e.target.value)}
              placeholder="Nombre de tu comercio"
              className="px-4 py-3 text-sm border border-slate-200 rounded-xl w-64 focus:outline-none focus:border-[#004AC6]"
            />
            <button
              onClick={() => newStore.trim() && createSellerWorkspace(newStore.trim())}
              className="px-6 py-3 rounded-xl bg-[#004AC6] text-white font-bold text-sm hover:bg-[#1D4ED8] cursor-pointer"
            >
              Crear tienda
            </button>
          </div>
        )}
      </div>
    );
  }

  const seller = sellers.find((s) => s.storeName === activeSellerName) ?? sellers[0];
  const role = mySellerRole(seller.storeName);

  if (!role) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-slate-900">Sin acceso a esta tienda</h1>
        <p className="text-sm text-slate-500 mt-2">
          Tu cuenta ({currentUser?.email || 'invitado'}) no es miembro de "{seller.storeName}".
          Pedile al dueño que te invite con tu email.
        </p>
      </div>
    );
  }

  const myProducts = products.filter((p) => p.vendor === seller.storeName);
  const myOrders = orders.filter((o) => (o.sellerName || o.items?.[0]?.product?.vendor) === seller.storeName);
  const pendingNet = myOrders.filter((o) => o.payoutStatus === 'pendiente')
    .reduce((s, o) => s + (o.settlement?.netPayout ?? 0), 0);
  const myPayouts = payouts.filter((p) => p.sellerName === seller.storeName);
  const lowStock = myProducts.filter((p) => p.stock <= 2).length;

  const tabs: { key: WorkspaceModule; label: string; icon: React.ReactNode }[] = [
    { key: 'resumen', label: 'Resumen', icon: <Store className="w-4 h-4" /> },
    { key: 'estadisticas', label: 'Estadísticas de Ventas', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'pedidos', label: `Pedidos (${myOrders.length})`, icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'stock', label: `Stock (${myProducts.length})`, icon: <Package className="w-4 h-4" /> },
    { key: 'empleados', label: `Equipo (${seller.members.length})`, icon: <Users className="w-4 h-4" /> },
    { key: 'publicidad', label: 'Publicidad', icon: <Megaphone className="w-4 h-4" /> },
    { key: 'integraciones', label: 'Integraciones', icon: <Plug className="w-4 h-4" /> },
    { key: 'finanzas', label: 'Finanzas', icon: <Wallet className="w-4 h-4" /> },
  ];

  const gated = (module: WorkspaceModule, content: React.ReactNode) => {
    if (!canAccessModule(role, module)) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">Módulo restringido para tu rol ({roleLabel(role)})</p>
          <p className="text-xs text-slate-500 mt-1">Pedile al dueño o a un administrador que te amplíe los permisos.</p>
        </div>
      );
    }
    return content;
  };

  const toggleCampProduct = (id: string) => {
    setCampForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" /> Panel vendedor · {roleLabel(role)}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">{seller.storeName}</h1>
            {sellers.length > 1 && (
              <select
                value={seller.storeName}
                onChange={(e) => setActiveSellerName(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-semibold"
              >
                {sellers.map((s) => (
                  <option key={s.id} value={s.storeName}>{s.storeName}</option>
                ))}
              </select>
            )}
            {lowStock > 0 && (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                ⚠ {lowStock} con stock bajo
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setCurrentView('view-publicar')}
          className="px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer inline-flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Publicar producto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon} {t.label}
            {!canAccessModule(role, t.key) && <Lock className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* RESUMEN */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Productos publicados', value: String(myProducts.length), sub: 'en catálogo' },
              { label: 'Pedidos recibidos', value: String(myOrders.length), sub: 'para preparar' },
              { label: 'Neto pendiente', value: formatPrice(pendingNet), sub: 'a tu favor' },
              { label: 'Equipo', value: String(seller.members.length + 1), sub: 'vos + empleados' },
            ].map((k) => (
              <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k.label}</div>
                <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">{k.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setTab('pedidos')} className="p-4 rounded-2xl bg-[#004AC6] text-white text-left hover:bg-[#1D4ED8] transition-colors cursor-pointer">
              <div className="text-sm font-bold flex items-center gap-2"><Truck className="w-4 h-4" /> Pedidos por preparar</div>
              <div className="text-xs text-blue-100 mt-1">{myOrders.filter((o) => o.status === 'en_preparacion').length} esperando despacho →</div>
            </button>
            <button onClick={() => setTab('stock')} className="p-4 rounded-2xl bg-white border border-slate-200 text-left hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2"><Package className="w-4 h-4 text-orange-600" /> Gestionar stock</div>
              <div className="text-xs text-slate-500 mt-1">Sumar, quitar o eliminar productos →</div>
            </button>
          </div>
        </div>
      )}

      {/* ESTADÍSTICAS DE VENTAS */}
      {tab === 'estadisticas' && gated('estadisticas', (
        <div className="space-y-6">
          <div className="glass-panel-3d rounded-3xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Métricas de Rendimiento · {seller.storeName}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Estadísticas de Ventas y Liquidación
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('admin')}
                className="px-4 py-2 rounded-xl bg-[#004AC6] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Ver Centro Global de Analíticas</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* KPI Cards for Seller */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Facturación Bruta</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-1">
                  {formatPrice(myOrders.reduce((s, o) => s + o.total, 0))}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">+14.2% este mes</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Neto a Liquidar</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-1">
                  {formatPrice(
                    myOrders.reduce((s, o) => s + (o.settlement?.netPayout || Math.round(o.total * 0.935)), 0)
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Deducida comisión ~6.5%</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pedidos Vendidos</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-1">
                  {myOrders.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {myOrders.filter((o) => o.status === 'completado').length} entregados
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket Promedio</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-1">
                  {formatPrice(
                    myOrders.length > 0
                      ? Math.round(myOrders.reduce((s, o) => s + o.total, 0) / myOrders.length)
                      : 0
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Por comprador</div>
              </div>
            </div>

            {/* Seller Best Selling Items */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tus Productos con Mayor Salida
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myProducts.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                    <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">{p.title}</div>
                      <div className="text-[11px] text-blue-600 font-extrabold tabular-nums mt-0.5">
                        {formatPrice(p.price)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Stock remanente: <strong className="text-slate-700">{p.stock} u.</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ))}

      {/* PEDIDOS */}
      {tab === 'pedidos' && gated('pedidos', (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          {myOrders.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">Todavía no recibiste pedidos. Cuando alguien compre tus productos aparecen acá.</p>
          )}
          {myOrders.map((o) => {
            const next = NEXT_STATUS[o.status];
            const st = STATUS_LABEL[o.status];
            return (
              <div key={o.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#004AC6] text-sm">{o.orderNumber}</span>
                    <span className="text-[11px] text-slate-400">{o.date}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    {o.returnRequested && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">↩ Devolución pedida</span>
                    )}
                  </div>
                  {next && (
                    <button
                      onClick={() => updateOrderStatus(o.id, next)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      {next === 'despachado' ? 'Marcar despachado' : 'Marcar entregado'}
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900">{o.customer.fullName}</span> · {o.customer.city} · {o.customer.phone}
                </div>
                <div className="text-xs text-slate-500">
                  {o.items.map((i) => `${i.quantity}× ${i.product.title}`).join(' · ')}
                </div>
                <div className="flex items-center gap-4 text-xs pt-1 border-t border-slate-100">
                  <span>Bruto <strong className="tabular-nums">{formatPrice(o.settlement?.gross ?? o.total)}</strong></span>
                  <span className="text-slate-400">Comisión −{formatPrice(o.settlement?.platformFee ?? 0)}</span>
                  <span className="font-bold text-emerald-700">Neto tuyo {formatPrice(o.settlement?.netPayout ?? o.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* STOCK */}
      {tab === 'stock' && gated('stock', (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mi stock y catálogo</h3>
              <p className="text-xs text-slate-500">Sumá, quitá, cambiá precios o eliminá publicaciones. Se refleja al instante.</p>
            </div>
            <button
              onClick={() => setCurrentView('view-publicar')}
              className="px-3.5 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Añadir stock
            </button>
          </div>
          {myProducts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No tenés productos. Publicá el primero con el botón de arriba.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b text-slate-400 uppercase text-[10px]">
                    <th className="pb-2 pr-2">Producto</th>
                    <th className="pb-2 px-2 text-right">Precio</th>
                    <th className="pb-2 px-2 text-center">Stock</th>
                    <th className="pb-2 pl-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          <img src={p.image} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[220px]">{p.title}</div>
                            <div className="font-mono text-[10px] text-slate-400">{p.sku} · {p.estado}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {editingPriceId === p.id ? (
                          <span className="inline-flex items-center gap-1">
                            <input type="number" value={tempPrice} onChange={(e) => setTempPrice(Number(e.target.value))} className="w-24 px-2 py-1 text-xs border border-[#004AC6] rounded-lg font-bold tabular-nums" />
                            <button onClick={() => { if (tempPrice > 0) updateProductPrice(p.id, tempPrice); setEditingPriceId(null); }} className="p-1 bg-emerald-600 text-white rounded-lg cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingPriceId(null)} className="p-1 bg-slate-200 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
                            {formatPrice(p.price)}
                            <button onClick={() => { setEditingPriceId(p.id); setTempPrice(p.price); }} className="text-slate-400 hover:text-[#004AC6] cursor-pointer" title="Editar precio"><Edit2 className="w-3 h-3" /></button>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => updateProductStock(p.id, p.stock - 1)} disabled={p.stock <= 0} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-40 cursor-pointer flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                          <span className={`w-8 text-center font-bold tabular-nums ${p.stock === 0 ? 'text-rose-600' : p.stock <= 2 ? 'text-amber-700' : ''}`}>{p.stock}</span>
                          <button onClick={() => updateProductStock(p.id, p.stock + 1)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        {confirmDeleteId === p.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                            <button onClick={() => { deleteProduct(p.id); setConfirmDeleteId(null); }} className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer">Sí</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 rounded-lg bg-slate-200 text-[11px] font-bold cursor-pointer">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(p.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" title="Eliminar producto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* EMPLEADOS */}
      {tab === 'empleados' && gated('empleados', (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-[#004AC6]" /> Invitar empleado</h3>
            <p className="text-xs text-slate-500 mt-1">Entran con su email y solo ven los módulos de su rol.</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3">
              <input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="Nombre" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <input value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="Email" type="email" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as SellerRole })} className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold">
                {SELLER_ROLES.filter((r) => r.value !== 'owner').map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!memberForm.name.trim() || !memberForm.email.trim()) return;
                  inviteMember(seller.storeName, { name: memberForm.name.trim(), email: memberForm.email.trim(), role: memberForm.role });
                  setMemberForm({ name: '', email: '', role: 'ventas' });
                }}
                className="px-3 py-2 text-xs font-bold bg-[#004AC6] text-white rounded-xl hover:bg-[#1D4ED8] cursor-pointer"
              >
                Enviar invitación
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Empleado</th>
                  <th className="pb-2">Rol</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 font-bold">{seller.ownerEmail || 'Dueño'} <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px]">DUEÑO</span></td>
                  <td className="py-2.5 text-slate-500">Control total</td>
                  <td className="py-2.5"><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Activo</span></td>
                  <td className="py-2.5" />
                </tr>
                {seller.members.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.email}</div>
                    </td>
                    <td className="py-2.5">
                      <select
                        value={m.role}
                        onChange={(e) => updateMemberRole(seller.storeName, m.id, e.target.value as SellerRole)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-semibold"
                      >
                        {SELLER_ROLES.filter((r) => r.value !== 'owner').map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5">
                      <button onClick={() => toggleMemberActive(seller.storeName, m.id)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold cursor-pointer ${m.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                        <Power className="w-3 h-3" /> {m.active ? 'Activo' : 'Pausado'}
                      </button>
                    </td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => removeMember(seller.storeName, m.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {seller.members.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-400">Todavía no invitaste empleados. El equipo aparece acá.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* PUBLICIDAD */}
      {tab === 'publicidad' && gated('publicidad', (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold flex items-center gap-2"><Megaphone className="w-4 h-4 text-orange-600" /> Nueva campaña</h3>
            <p className="text-xs text-slate-500 mt-1">Los productos impulsados llevan badge Destacado en el catálogo.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
              <input value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} placeholder="Nombre (ej: Cyber Week TV)" className="px-3 py-2 text-xs border border-slate-200 rounded-xl" />
              <input value={campForm.budget} onChange={(e) => setCampForm({ ...campForm, budget: Number(e.target.value) })} type="number" min={0} placeholder="Presupuesto ARS" className="px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums" />
              <button
                onClick={() => {
                  if (!campForm.name.trim() || campForm.productIds.length === 0) return;
                  createAdCampaign(seller.storeName, { name: campForm.name.trim(), productIds: campForm.productIds, budget: campForm.budget });
                  setCampForm({ name: '', budget: 10000, productIds: [] });
                }}
                className="px-3 py-2 text-xs font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-700 cursor-pointer"
              >
                Activar campaña
              </button>
            </div>
            <div className="mt-3">
              <div className="text-[11px] font-bold text-slate-500 mb-1.5">Productos a impulsar ({campForm.productIds.length})</div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {myProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggleCampProduct(p.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${campForm.productIds.includes(p.id) ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    {p.title.slice(0, 32)}
                  </button>
                ))}
                {myProducts.length === 0 && <span className="text-xs text-slate-400">Primero publicá productos en tu tienda.</span>}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            {seller.campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.productIds.length} productos · Presupuesto {formatPrice(c.budget)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.status === 'activa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                  <button onClick={() => toggleAdCampaign(seller.storeName, c.id)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer" title={c.status === 'activa' ? 'Pausar' : 'Activar'}>
                    {c.status === 'activa' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            {seller.campaigns.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Sin campañas. Creá la primera arriba.</p>}
          </div>
        </div>
      ))}

      {/* INTEGRACIONES */}
      {tab === 'integraciones' && gated('integraciones', (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INTEGRATION_CATALOG.map((item) => {
            const state = seller.integrations.find((i) => i.key === item.key);
            const on = state?.enabled;
            return (
              <div key={item.key} className={`border rounded-2xl p-5 ${on ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plug className="w-4 h-4 text-[#004AC6]" /> {item.name}
                  </h3>
                  {on && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><BadgeCheck className="w-3.5 h-3.5" /> Conectado</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.description}</p>
                {on && state?.accountLabel && <p className="text-[11px] font-mono text-slate-600 mt-1">{state.accountLabel}</p>}
                <button
                  onClick={() => toggleIntegration(seller.storeName, item.key)}
                  className={`mt-3 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${on ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-[#004AC6] text-white hover:bg-[#1D4ED8]'}`}
                >
                  {on ? 'Desconectar' : item.cta}
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {/* FINANZAS */}
      {tab === 'finanzas' && gated('finanzas', (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" /> Tu dinero</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Neto pendiente</div>
                <div className="text-xl font-black tabular-nums">{formatPrice(pendingNet)}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Ya transferido</div>
                <div className="text-xl font-black tabular-nums">{formatPrice(seller.balanceTransferred)}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 text-white">
                <div className="text-[11px] font-bold uppercase text-slate-400">Comisión SoloOutlet</div>
                <div className="text-xl font-black tabular-nums">
                  {formatPrice(myOrders.reduce((s, o) => s + (o.settlement?.platformFee ?? 0), 0))}
                </div>
              </div>
            </div>
            <button
              onClick={() => pendingNet > 0 && requestSellerPayout(seller.storeName)}
              disabled={pendingNet <= 0}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
            >
              Solicitar transferencia de {formatPrice(pendingNet)} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-3">Mis liquidaciones ({myPayouts.length})</h3>
            {myPayouts.length === 0 ? (
              <p className="text-xs text-slate-400">Cuando pidas una transferencia aparece acá su estado.</p>
            ) : (
              <div className="space-y-2">
                {myPayouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#004AC6]">{p.id}</span>
                      <span className="text-slate-500"> · {p.orderNumbers.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold tabular-nums">{formatPrice(p.netAmount)}</span>
                      {p.status === 'transferido'
                        ? <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Transferido</span>
                        : <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold">Pendiente</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
