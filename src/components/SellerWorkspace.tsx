import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { isApiMode, API_URL, load } from '../data/db';
import { AuthSession } from '../data/auth';
import { formatPrice } from '../utils/formatters';
import { canAccessModule, roleLabel, SELLER_ROLES, INTEGRATION_CATALOG, WorkspaceModule, isPlatformOwner } from '../utils/sellerWorkspace';
import { SellerRole, Order } from '../types';
import { animateGridIn, animateCounter } from '../utils/animations';
import { COURIERS, CourierId, SHIPMENT_STATUS_LABEL, quoteShipment, isPickupOverdue, estimateWeightKg } from '../utils/logistics';

/** Código de barras simulado (visual): barras determinísticas a partir del tracking. */
const BarcodeSim: React.FC<{ code: string }> = ({ code }) => {
  const bars = Array.from(code).flatMap((ch) => {
    const n = ch.charCodeAt(0);
    return [n % 3 + 1, (n >> 2) % 2 + 1, (n >> 4) % 3 + 1];
  });
  return (
    <div className="flex items-end gap-px h-10" aria-hidden>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w, height: '100%', background: i % 2 ? '#fff' : '#0f172a' }} />
      ))}
    </div>
  );
};

/** KPI con valor que cuenta de 0 al final al montar. */
const AnimatedKpiValue: React.FC<{ value: number; format: (v: number) => string }> = ({ value, format }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    animateCounter(ref.current!, value, format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <div ref={ref} className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-1">{format(0)}</div>;
};
import {
  Store, Users, Megaphone, Plug, Wallet, Plus, Pause, Play,
  Trash2, Power, Lock, ArrowRight, BadgeCheck, Package,
  Truck, Minus, Edit2, Check, X, ShoppingBag, TrendingUp, BarChart3, ArrowUpRight, DollarSign,
  Eye, EyeOff, Sparkles,
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
    createOrderShipment, advanceOrderTracking,
    deleteProduct, requestSellerPayout, payouts,
    currentUser, openAuthModal, setCurrentView, showToast,
  } = useStore();

  const [tab, setTab] = useState<WorkspaceModule>('resumen');
  const kpiGridRef = useRef<HTMLDivElement>(null);

  // Stagger de KPIs solo al montar la pestaña estadísticas
  useEffect(() => {
    if (tab === 'estadisticas' && kpiGridRef.current) {
      animateGridIn(':scope > div', kpiGridRef.current, { delay: 70 });
    }
  }, [tab]);
  // Modo "interface de prueba": datos ficticios para mostrar cómo se ve el panel
  // con actividad real, sin tocar los datos verdaderos de la tienda.
  const [previewMode, setPreviewMode] = useState(false);
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);
  const [labelCourier, setLabelCourier] = useState<CourierId>('andreani');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [newStore, setNewStore] = useState('');
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'ventas' as SellerRole });
  const [campForm, setCampForm] = useState({ name: '', budget: 10000, productIds: [] as string[] });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Estado de conexión OAuth con Mercado Pago (modo API)
  const [mpStatus, setMpStatus] = useState<{ connected: boolean; mpUserId?: string | null } | null>(null);
  useEffect(() => {
    if (!isApiMode || !currentUser) return;
    const session = load<AuthSession | null>('solooutlet_auth_session', null);
    fetch(`${API_URL}/seller/mp/status`, { headers: { Authorization: `Bearer ${session?.token ?? ''}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMpStatus(d))
      .catch(() => {});
  }, [isApiMode, currentUser]);
  const mpConnected = !!mpStatus?.connected;

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

  const realProducts = products.filter((p) => p.vendor === seller.storeName);
  const realOrders = orders.filter((o) => (o.sellerName || o.items?.[0]?.product?.vendor) === seller.storeName);

  // ── Datos de la interface de prueba (solo visuales, nunca se guardan) ──
  const demoProducts: typeof realProducts = previewMode && realProducts.length === 0 ? [
    {
      id: 'demo-1', sku: 'DEMO-TEC-001', title: 'Notebook 14" reacondicionada (demo)',
      vendor: seller.storeName, vendorRating: 4.8, estado: 'Reacondicionado', cat: 'Tecnología',
      price: 389999, originalPrice: 529999, discount: 26,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=60',
      stock: 3, conditionDetails: 'Producto de demostración', warrantyDays: 90,
      specs: ['Spec de demo'], tags: ['Tecnología'], isFeatured: true, createdAt: new Date().toISOString().split('T')[0],
    },
    {
      id: 'demo-2', sku: 'DEMO-HOG-002', title: 'Cafetera express (demo)',
      vendor: seller.storeName, vendorRating: 4.8, estado: 'Sin caja', cat: 'Electrodomésticos',
      price: 94999, originalPrice: 139999, discount: 32,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=400&q=60',
      stock: 5, conditionDetails: 'Producto de demostración', warrantyDays: 60,
      specs: ['Spec de demo'], tags: ['Hogar'], isFeatured: false, createdAt: new Date().toISOString().split('T')[0],
    },
  ] : [];
  const demoOrders: typeof realOrders = previewMode && realOrders.length === 0 ? ([
    ['SO-1042', 'Lucía Fernández', 'CABA - Palermo', 'completado', 389999, 349999, 10],
    ['SO-1041', 'Diego Sosa', 'Rosario', 'despachado', 94999, 85499, 10],
    ['SO-1040', 'Carla Ruiz', 'Córdoba', 'en_preparacion', 129900, 116910, 10],
  ] as const).map(([orderNumber, name, city, status, total, net, fee], i) => ({
    id: `demo-ord-${i}`, orderNumber, date: 'Demo', customer: { fullName: name, email: '', phone: '', address: '', city, postalCode: '' },
    items: [{ product: demoProducts[0] ?? ({} as never), quantity: 1, unitPrice: total }],
    subtotal: total, discountAmount: 0, shipping: 0, total,
    paymentDetails: { method: 'mercadopago' as const },
    status: status as Order['status'], sellerName: seller.storeName,
    settlement: { gross: total, platformFee: total - net, gatewayFee: 0, netPayout: net, rateApplied: 0.1 },
    payoutStatus: 'pendiente' as const,
  })) : [];

  const myProducts = previewMode && realProducts.length === 0 ? demoProducts : realProducts;
  const myOrders = previewMode && realOrders.length === 0 ? demoOrders : realOrders;
  const pendingNet = myOrders.filter((o) => o.payoutStatus === 'pendiente')
    .reduce((s, o) => s + (o.settlement?.netPayout ?? 0), 0);
  const myPayouts = payouts.filter((p) => p.sellerName === seller.storeName);
  const lowStock = myProducts.filter((p) => p.stock <= 2).length;
  const hasNothing = realProducts.length === 0 && realOrders.length === 0;

  // Acciones protegidas: en modo preview (o con tienda vacía) no mutan nada.
  const guard = (fn: () => void) => () => {
    if (previewMode || hasNothing) {
      showToast('👀 Estás viendo la interface de prueba: salí del modo demo para operar de verdad.');
      return;
    }
    fn();
  };
  void updateOrderStatus; void updateProductStock; void updateProductPrice; void deleteProduct;

  const tabs: { key: WorkspaceModule; label: string; icon: React.ReactNode }[] = [
    { key: 'resumen', label: 'Resumen', icon: <BarChart3 className="w-4 h-4" /> },
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
    <div className="min-h-[80vh] bg-slate-950/[0.03]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header profesional de tienda */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#0a2540] text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                Centro de Ventas · {roleLabel(role)}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display">{seller.storeName}</h1>
                {sellers.length > 1 && (
                  <select
                    value={seller.storeName}
                    onChange={(e) => setActiveSellerName(e.target.value)}
                    className="text-xs border border-white/20 bg-white/10 text-white rounded-lg px-2 py-1.5 font-semibold"
                  >
                    {sellers.map((s) => (
                      <option key={s.id} value={s.storeName} className="text-slate-900">{s.storeName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300 flex-wrap">
                <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Tienda verificada</span>
                <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {myProducts.length} publicaciones</span>
                <span className="inline-flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> {myOrders.length} pedidos</span>
                {lowStock > 0 && (
                  <span className="font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    ⚠ {lowStock} con stock bajo
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Interface de prueba */}
            <button
              onClick={() => {
                setPreviewMode((v) => !v);
                showToast(previewMode ? 'Modo real: operás con tus datos verdaderos.' : '👀 Interface de prueba activada: datos ficticios solo para ver cómo funciona.');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                previewMode ? 'bg-amber-400 text-slate-900 hover:bg-amber-300' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
              title={previewMode ? 'Volver a tus datos reales' : 'Ver el panel con datos de ejemplo sin afectar tu tienda'}
            >
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? 'Salir de la prueba' : 'Interface de prueba'}
            </button>
            <button
              onClick={() => setCurrentView('view-publicar')}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/25"
            >
              <Plus className="w-4 h-4" /> Publicar producto
            </button>
          </div>
        </div>

        {/* Barra de métricas rápida */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Facturación total', value: formatPrice(myOrders.reduce((s, o) => s + o.total, 0)), icon: <DollarSign className="w-4 h-4" /> },
            { label: 'Neto a liquidar', value: formatPrice(pendingNet), icon: <Wallet className="w-4 h-4" /> },
            { label: 'Por preparar', value: String(myOrders.filter((o) => o.status === 'en_preparacion').length), icon: <Truck className="w-4 h-4" /> },
            { label: 'Entregados', value: String(myOrders.filter((o) => o.status === 'completado').length), icon: <BadgeCheck className="w-4 h-4" /> },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl bg-white/[0.07] border border-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">{k.icon} {k.label}</div>
              <div className="text-lg font-black tabular-nums mt-0.5">{k.value}</div>
            </div>
          ))}
        </div>

        {(previewMode || hasNothing) && (
          <div className="relative mt-4 flex items-center gap-2 text-[11px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            Interface de prueba: los datos que ves son de ejemplo. Publicá tu primer producto o generá una venta real para operar en serio.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              tab === t.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.icon} {t.label}
            {!canAccessModule(role, t.key) && <Lock className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* RESUMEN — centro de control de ventas */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setTab('pedidos')} className="p-5 rounded-2xl bg-[#004AC6] text-white text-left hover:bg-[#1D4ED8] transition-colors cursor-pointer shadow-md shadow-blue-900/10">
              <div className="text-sm font-bold flex items-center gap-2"><Truck className="w-4 h-4" /> Pedidos por preparar</div>
              <div className="text-xs text-blue-100 mt-1">{myOrders.filter((o) => o.status === 'en_preparacion').length} esperando despacho →</div>
            </button>
            <button onClick={() => setTab('finanzas')} className="p-5 rounded-2xl bg-emerald-600 text-white text-left hover:bg-emerald-700 transition-colors cursor-pointer shadow-md shadow-emerald-900/10">
              <div className="text-sm font-bold flex items-center gap-2"><Wallet className="w-4 h-4" /> Cobrar mi dinero</div>
              <div className="text-xs text-emerald-100 mt-1">{formatPrice(pendingNet)} disponibles a liquidar →</div>
            </button>
            <button onClick={() => setTab('stock')} className="p-5 rounded-2xl bg-white border border-slate-200 text-left hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2"><Package className="w-4 h-4 text-orange-600" /> Gestionar catálogo</div>
              <div className="text-xs text-slate-500 mt-1">{myProducts.length} publicaciones · precios y stock →</div>
            </button>
          </div>

          {/* Acciones rápidas del día */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Tus pedidos recientes</h3>
            {myOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Todavía no recibiste pedidos. Cuando alguien compre aparecen acá al instante.</p>
            ) : (
              <div className="space-y-2">
                {myOrders.slice(0, 4).map((o) => {
                  const st = STATUS_LABEL[o.status];
                  return (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-bold text-[#004AC6] text-xs">{o.orderNumber}</span>
                        <span className="text-xs text-slate-600 truncate">{o.customer.fullName} · {o.customer.city}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold tabular-nums">{formatPrice(o.settlement?.netPayout ?? o.total)}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              {isPlatformOwner(currentUser) && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className="px-4 py-2 rounded-xl bg-[#004AC6] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Ver Centro Global de Analíticas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* KPI Cards for Seller */}
            <div className="kpi-grid grid grid-cols-2 lg:grid-cols-4 gap-4" ref={kpiGridRef}>
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Facturación Bruta</div>
                <AnimatedKpiValue value={myOrders.reduce((s, o) => s + o.total, 0)} format={formatPrice} />
                <div className="text-[11px] text-emerald-600 font-bold mt-1">+14.2% este mes</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Neto a Liquidar</div>
                <AnimatedKpiValue
                  value={myOrders.reduce((s, o) => s + (o.settlement?.netPayout || Math.round(o.total * 0.88)), 0)}
                  format={formatPrice}
                />
                <div className="text-[11px] text-slate-500 mt-1">Deducida comisión de plataforma (10–15%)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pedidos Vendidos</div>
                <AnimatedKpiValue value={myOrders.length} format={(v) => String(Math.round(v))} />
                <div className="text-[11px] text-slate-500 mt-1">
                  {myOrders.filter((o) => o.status === 'completado').length} entregados
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket Promedio</div>
                <AnimatedKpiValue
                  value={myOrders.length > 0 ? Math.round(myOrders.reduce((s, o) => s + o.total, 0) / myOrders.length) : 0}
                  format={formatPrice}
                />
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
                    {o.dispute && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">🚨 Disputa: {o.dispute.reasonLabel}</span>
                    )}
                  </div>
                  {next && !o.shipment && o.status === 'en_preparacion' && (
                    <button
                      onClick={guard(() => setLabelOrder(o))}
                      className="px-3 py-1.5 rounded-lg bg-[#004AC6] text-white text-[11px] font-bold hover:bg-[#1D4ED8] cursor-pointer inline-flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Generar etiqueta de envío
                    </button>
                  )}
                  {o.shipment && o.shipment.status !== 'delivered' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={guard(() => advanceOrderTracking(o.id))}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Simular escaneo del courier
                      </button>
                    </div>
                  )}
                  {next && !o.shipment && o.status === 'despachado' && (
                    <button
                      onClick={guard(() => updateOrderStatus(o.id, next))}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Marcar entregado
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900">{o.customer.fullName}</span> · {o.customer.city} · {o.customer.phone}
                </div>
                <div className="text-xs text-slate-500">
                  {o.items.map((i) => `${i.quantity}× ${i.product.title}`).join(' · ')}
                </div>                  {o.shipment && (
                  <div className={`flex flex-wrap items-center gap-3 text-[11px] rounded-lg px-3 py-2 border ${isPickupOverdue(o) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <span className="font-mono font-bold">📦 {o.shipment.trackingNumber}</span>
                    <span>{o.shipment.courierName}</span>
                    <span className="font-bold">{SHIPMENT_STATUS_LABEL[o.shipment.status]}</span>
                    <span>Llega: {new Date(o.shipment.etaDate).toLocaleDateString('es-AR')}</span>
                    <button
                      onClick={guard(() => setPrintOrder(o))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      🖨️ Imprimir etiqueta
                    </button>
                    {isPickupOverdue(o) && <span className="font-bold">⚠️ SLA vencido: el courier no retiró en 48 h — el pago queda retenido</span>}
                  </div>
                )}
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
                            <button onClick={guard(() => { if (tempPrice > 0) updateProductPrice(p.id, tempPrice); setEditingPriceId(null); })} className="p-1 bg-emerald-600 text-white rounded-lg cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingPriceId(null)} className="p-1 bg-slate-200 rounded-lg cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
                            {formatPrice(p.price)}
                            <button onClick={guard(() => { setEditingPriceId(p.id); setTempPrice(p.price); })} className="text-slate-400 hover:text-[#004AC6] cursor-pointer" title="Editar precio"><Edit2 className="w-3 h-3" /></button>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={guard(() => updateProductStock(p.id, p.stock - 1))} disabled={p.stock <= 0} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-40 cursor-pointer flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                          <span className={`w-8 text-center font-bold tabular-nums ${p.stock === 0 ? 'text-rose-600' : p.stock <= 2 ? 'text-amber-700' : ''}`}>{p.stock}</span>
                          <button onClick={guard(() => updateProductStock(p.id, p.stock + 1))} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        {confirmDeleteId === p.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">¿Eliminar?</span>
                            <button onClick={guard(() => { deleteProduct(p.id); setConfirmDeleteId(null); })} className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer">Sí</button>
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
                onClick={guard(() => {
                  if (!memberForm.name.trim() || !memberForm.email.trim()) return;
                  inviteMember(seller.storeName, { name: memberForm.name.trim(), email: memberForm.email.trim(), role: memberForm.role });
                  setMemberForm({ name: '', email: '', role: 'ventas' });
                })}
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
          {/* Mercado Pago OAuth (split de pagos real) va primero */}
          <div className={`border rounded-2xl p-5 sm:col-span-2 ${mpConnected ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plug className="w-4 h-4 text-[#004AC6]" /> Mercado Pago — Cobros marketplace
              </h3>
              {mpConnected && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><BadgeCheck className="w-3.5 h-3.5" /> Conectado</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Vinculá tu cuenta de Mercado Pago: cuando un comprador paga, MP te acredita el neto directo en tu cuenta y la comisión de solooutlet se cobra automáticamente (split de pagos). Sin transferencias manuales.
            </p>
            {mpConnected && mpStatus?.mpUserId && <p className="text-[11px] font-mono text-slate-600 mt-1">Cuenta MP: {mpStatus.mpUserId}</p>}
            {isApiMode ? (
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={`${API_URL}/seller/mp/connect`}
                  className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-[#004AC6] text-white hover:bg-[#1D4ED8]"
                >
                  {mpConnected ? 'Reconectar cuenta MP' : 'Conectar mi Mercado Pago'}
                </a>
                {mpConnected && (
                  <button
                    onClick={async () => {
                      const session = load<AuthSession | null>('solooutlet_auth_session', null);
                      await fetch(`${API_URL}/seller/mp/disconnect`, { method: 'POST', headers: { Authorization: `Bearer ${session?.token ?? ''}` } });
                      setMpStatus({ connected: false });
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-amber-700 mt-2 font-semibold">Disponible en modo producción (con base de datos conectada).</p>
            )}
          </div>

          {INTEGRATION_CATALOG.filter((i) => i.key !== 'mercadopago').map((item) => {
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

      {/* MODAL: Etiqueta imprimible */}
      {printOrder?.shipment && (() => {
        const s = printOrder.shipment;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60" onClick={() => setPrintOrder(null)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5">
              {/* Etiqueta */}
              <div id="shipping-label" className="border-2 border-slate-900 rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                  <span className="font-black text-slate-900 text-sm">solo<span className="text-[#004AC6]">outlet</span> · {s.courierName}</span>
                  <span className="text-[10px] font-bold text-slate-500">ENVÍO ESTÁNDAR</span>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase text-slate-500">Destinatario</div>
                  <div className="text-sm font-extrabold text-slate-900">{printOrder.customer.fullName}</div>
                  <div className="text-xs text-slate-700">{printOrder.customer.address}</div>
                  <div className="text-xs text-slate-700">{printOrder.customer.city} — CP {printOrder.customer.postalCode}</div>
                  <div className="text-xs text-slate-700">Tel: {printOrder.customer.phone}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase text-slate-500">Remitente</div>
                  <div className="text-xs font-bold text-slate-900">{printOrder.sellerName || 'Vendedor'} · vía solooutlet</div>
                </div>
                <div className="flex flex-col items-center gap-1 pt-1">
                  <BarcodeSim code={s.trackingNumber} />
                  <span className="font-mono text-xs font-bold text-slate-900 tracking-widest">{s.trackingNumber}</span>
                  <span className="text-[9px] text-slate-500">Peso: {s.weightKg.toFixed(1)} kg · Llega est.: {new Date(s.etaDate).toLocaleDateString('es-AR')}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPrintOrder(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Cerrar
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#004AC6] hover:bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
                >
                  🖨️ Imprimir / Guardar PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Generar etiqueta de envío (auto-logística demo) */}
      {labelOrder && (() => {
        const weight = labelOrder.items.reduce((s, i) => s + estimateWeightKg(i.product.cat) * i.quantity, 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60" onClick={() => setLabelOrder(null)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#004AC6]">Auto-logística solooutlet</div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Generar etiqueta · {labelOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Destino: <strong>{labelOrder.customer.city}</strong> · Peso estimado: <strong>{weight.toFixed(1)} kg</strong>
                </p>
              </div>
              <div className="space-y-2">
                {COURIERS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setLabelCourier(c.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      labelCourier === c.id ? 'border-[#004AC6] bg-blue-50/60 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-500">Llega en ~{c.etaDays} día(s) hábil{c.etaDays > 1 ? 'es' : ''}</div>
                    </div>
                    <div className="text-xs font-extrabold tabular-nums text-slate-900">
                      {quoteShipment(c.id, weight, labelOrder.customer.city) === 0 ? 'Gratis' : formatPrice(quoteShipment(c.id, weight, labelOrder.customer.city))}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                El pago del comprador queda <strong>retenido por solooutlet</strong> hasta la confirmación de entrega. Vos solo despachás.
              </div>
              <div className="flex gap-2">
                <button onClick={() => setLabelOrder(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={guard(() => {
                    const shipment = createOrderShipment(labelOrder.id, labelCourier, weight);
                    setLabelOrder(null);
                    if (shipment) showToast(`✅ Etiqueta generada: ${shipment.trackingNumber} (${shipment.courierName})`);
                  })}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#004AC6] hover:bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
                >
                  Crear etiqueta
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
    </div>
  );
};
