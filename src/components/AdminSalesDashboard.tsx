import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { isPlatformOwner, isMerchant } from '../utils/sellerWorkspace';
import { formatPrice, getConditionBadgeStyle } from '../utils/formatters';
import { PayoutsDashboard } from './PayoutsDashboard';
import { ShieldAlert, Store } from 'lucide-react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Boxes,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Building2,
  Smartphone,
  Edit2,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { PaymentMethodType } from '../types';

export const AdminSalesDashboard: React.FC = () => {
  const { products, orders, updateProductStock, updateProductPrice, setCurrentView, currentUser } = useStore();

  // Solo staff de plataforma. Los vendedores usan Mi Tienda; los compradores no entran.
  if (!isPlatformOwner(currentUser)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Zona restringida</h1>
        <p className="text-sm text-slate-500 mt-2">
          Este panel es del equipo SoloOutlet. Como {isMerchant(currentUser) ? 'vendedor' : 'comprador'} tu lugar es {isMerchant(currentUser) ? 'tu tienda' : 'el catálogo'}.
        </p>
        <button
          onClick={() => setCurrentView(isMerchant(currentUser) ? 'seller-workspace' : 'catalog')}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#004AC6] text-white font-bold text-sm hover:bg-[#1D4ED8] cursor-pointer"
        >
          {isMerchant(currentUser) && <Store className="w-4 h-4" />}
          <span>{isMerchant(currentUser) ? 'Ir a Mi Tienda' : 'Explorar catálogo'}</span>
        </button>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'payouts'>('sales');
  const [inventorySearch, setInventorySearch] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Inline price edit state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Calculate today's sales
  const todayDateStr = new Date().toISOString().split('T')[0];

  const salesStats = useMemo(() => {
    const todayOrders = orders; // All recorded mock and live orders represent today's batch
    const validOrders = todayOrders.filter((o) => o.status !== 'cancelado');
    const totalRevenue = validOrders.reduce((sum, ord) => sum + ord.total, 0);
    const totalOrdersCount = validOrders.length;
    const avgTicket = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 2).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    // Breakdown by payment method
    const paymentBreakdown = {
      mercadopago: validOrders.filter((o) => o.paymentDetails.method === 'mercadopago').reduce((s, o) => s + o.total, 0),
      credit_card: validOrders.filter((o) => o.paymentDetails.method === 'credit_card').reduce((s, o) => s + o.total, 0),
      debit_card: validOrders.filter((o) => o.paymentDetails.method === 'debit_card').reduce((s, o) => s + o.total, 0),
      transfer: validOrders.filter((o) => o.paymentDetails.method === 'transfer').reduce((s, o) => s + o.total, 0),
    };

    return {
      totalRevenue,
      totalOrdersCount,
      avgTicket,
      lowStockCount,
      outOfStockCount,
      paymentBreakdown,
    };
  }, [orders, products]);

  // Inventory filtering
  const filteredInventory = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.vendor.toLowerCase().includes(inventorySearch.toLowerCase());

      if (!matchSearch) return false;

      if (filterStockStatus === 'low') return p.stock > 0 && p.stock <= 2;
      if (filterStockStatus === 'out') return p.stock === 0;

      return true;
    });
  }, [products, inventorySearch, filterStockStatus]);

  const handleStartEditPrice = (productId: string, currentPrice: number) => {
    setEditingPriceId(productId);
    setTempPrice(currentPrice);
  };

  const handleSavePrice = (productId: string) => {
    if (tempPrice > 0) {
      updateProductPrice(productId, tempPrice);
    }
    setEditingPriceId(null);
  };

  const renderPaymentBadge = (method: PaymentMethodType) => {
    switch (method) {
      case 'mercadopago':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#009EE3] bg-[#009EE3]/10 px-2 py-0.5 rounded">
            <Smartphone className="w-3 h-3" /> Mercado Pago
          </span>
        );
      case 'credit_card':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
            <CreditCard className="w-3 h-3" /> Tarjeta Crédito
          </span>
        );
      case 'debit_card':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            <CreditCard className="w-3 h-3" /> Débito
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            <Building2 className="w-3 h-3" /> DEBIN / Transf.
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header and Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema Central de Gestión</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Panel de Control & Ventas Diarias
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoreo en tiempo real de ingresos, transacciones de Mercado Pago y niveles de inventario.
          </p>
        </div>

        {/* View Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ventas Diarias ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gestión de Inventario ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Liquidaciones y comisiones
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Facturación Hoy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Facturación Total</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display">
            {formatPrice(salesStats.totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% vs promedio diario</span>
          </div>
        </div>

        {/* KPI 2: Pedidos Hoy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Ventas Procesadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display">
            {salesStats.totalOrdersCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Acreditación garantizada
          </div>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Ticket Promedio</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display">
            {formatPrice(salesStats.avgTicket)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Por compra completada
          </div>
        </div>

        {/* KPI 4: Alertas de Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Alertas de Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums font-display flex items-baseline gap-2">
            <span>{salesStats.lowStockCount}</span>
            <span className="text-xs font-semibold text-rose-600">
              ({salesStats.outOfStockCount} agotados)
            </span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Requiere reposición inmediata
          </div>
        </div>

      </div>

      {/* Main Tab Content */}
      {activeTab === 'payouts' ? (
        <PayoutsDashboard />
      ) : activeTab === 'sales' ? (
        <div className="space-y-8">
          
          {/* Payment Method Breakdown Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Desglose de Ventas por Método de Pago
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresos reales captados a través de las diferentes pasarelas integradas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#009EE3]/5 border border-[#009EE3]/20">
                <div className="text-[11px] font-bold text-[#009EE3] uppercase tracking-wider mb-1">
                  Mercado Pago
                </div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatPrice(salesStats.paymentBreakdown.mercadopago)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {salesStats.totalRevenue > 0
                    ? Math.round((salesStats.paymentBreakdown.mercadopago / salesStats.totalRevenue) * 100)
                    : 0}% del volumen
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                  Tarjeta de Crédito
                </div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatPrice(salesStats.paymentBreakdown.credit_card)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {salesStats.totalRevenue > 0
                    ? Math.round((salesStats.paymentBreakdown.credit_card / salesStats.totalRevenue) * 100)
                    : 0}% del volumen
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tarjeta de Débito
                </div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatPrice(salesStats.paymentBreakdown.debit_card)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {salesStats.totalRevenue > 0
                    ? Math.round((salesStats.paymentBreakdown.debit_card / salesStats.totalRevenue) * 100)
                    : 0}% del volumen
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  DEBIN / Transferencia
                </div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatPrice(salesStats.paymentBreakdown.transfer)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {salesStats.totalRevenue > 0
                    ? Math.round((salesStats.paymentBreakdown.transfer / salesStats.totalRevenue) * 100)
                    : 0}% del volumen
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Feed */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registro de Ventas y Pedidos de Hoy
                </h3>
                <p className="text-xs text-slate-500">
                  Transacciones completadas con comprobante y datos de entrega.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-3 pr-4">N° Pedido</th>
                    <th className="pb-3 px-4">Fecha / Hora</th>
                    <th className="pb-3 px-4">Cliente</th>
                    <th className="pb-3 px-4">Ítems comprados</th>
                    <th className="pb-3 px-4">Método de Pago</th>
                    <th className="pb-3 px-4 text-right">Total</th>
                    <th className="pb-3 pl-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-blue-600">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{order.customer.fullName}</div>
                        <div className="text-[11px] text-slate-400">{order.customer.city}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="max-w-xs truncate text-slate-700">
                          {order.items.map((i) => `${i.quantity}x ${i.product.title}`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderPaymentBadge(order.paymentDetails.method)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        {order.status === 'cancelado' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <X className="w-3 h-3" /> Cancelado
                          </span>
                        ) : order.status === 'en_preparacion' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> En preparación
                          </span>
                        ) : order.status === 'despachado' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Truck className="w-3 h-3" /> Despachado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Completado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      ) : (
        /* Inventory Management Tab */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Control de Stock en Tiempo Real
              </h3>
              <p className="text-xs text-slate-500">
                Modificá cantidades y precios al instante. Se refleja inmediatamente para todos los compradores.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterStockStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStockStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setFilterStockStatus('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStockStatus === 'low'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Bajo stock ({salesStats.lowStockCount})
              </button>
              <button
                onClick={() => setFilterStockStatus('out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStockStatus === 'out'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Agotados ({salesStats.outOfStockCount})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Buscar por SKU, nombre de producto o comercio..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Live Inventory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pr-3">Producto / SKU</th>
                  <th className="pb-3 px-3">Estado declarado</th>
                  <th className="pb-3 px-3">Comercio</th>
                  <th className="pb-3 px-3 text-right">Precio Actual</th>
                  <th className="pb-3 px-3 text-center">Stock en Tiempo Real</th>
                  <th className="pb-3 pl-3 text-right">Disponibilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((product) => {
                  const conditionStyle = getConditionBadgeStyle(product.estado);
                  const isEditingPrice = editingPriceId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Product details */}
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs">
                              {product.title}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Condition */}
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conditionStyle.bg}`}>
                          {product.estado}
                        </span>
                      </td>

                      {/* Vendor */}
                      <td className="py-3.5 px-3 text-slate-600 truncate max-w-[130px]">
                        {product.vendor}
                      </td>

                      {/* Price (Editable) */}
                      <td className="py-3.5 px-3 text-right">
                        {isEditingPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Number(e.target.value))}
                              className="w-24 px-2 py-1 text-xs border border-blue-500 rounded font-bold tabular-nums"
                            />
                            <button
                              onClick={() => handleSavePrice(product.id)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 group">
                            <span className="font-bold text-slate-900 tabular-nums">
                              {formatPrice(product.price)}
                            </span>
                            <button
                              onClick={() => handleStartEditPrice(product.id, product.price)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 transition-opacity"
                              title="Editar precio"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Stock Stepper */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => updateProductStock(product.id, product.stock - 1)}
                            disabled={product.stock <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                            aria-label="Restar una unidad de stock"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="w-8 text-center font-bold text-slate-900 tabular-nums">
                            {product.stock}
                          </span>

                          <button
                            onClick={() => updateProductStock(product.id, product.stock + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Sumar una unidad de stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status indicator */}
                      <td className="py-3.5 pl-3 text-right">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            Agotado
                          </span>
                        ) : product.stock <= 2 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                            Bajo stock ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            En stock ({product.stock})
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
