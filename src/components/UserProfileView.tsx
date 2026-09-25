import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice, getConditionBadgeStyle } from '../utils/formatters';
import { isMerchant, isPlatformOwner } from '../utils/sellerWorkspace';
import { Order, Product } from '../types';
import {
  Package,
  ShoppingBag,
  Heart,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Edit2,
  Save,
  LogOut,
  X,
  Check,
  Eye,
  Truck,
  RotateCcw,
  Clock,
  Copy,
  Store,
  TrendingUp,
} from 'lucide-react';
import { DEFAULT_LOCATIONS, POPULAR_LOCATION_SHORTCUTS } from '../data/locations';

export const UserProfileView: React.FC = () => {
  const {
    currentUser,
    orders,
    wishlist,
    logoutUser,
    updateUserProfile,
    setCurrentView,
    openProductModal,
    addToCart,
    setIsCartOpen,
    setIsCheckoutOpen,
    cancelOrder,
    requestReturn,
    addAddress,
    removeAddress,
  } = useStore();
  const [newAddr, setNewAddr] = useState({ label: 'Casa', fullName: '', phone: '', address: '', city: '', postalCode: '' });

  // Mode: 'orders' | 'seller' | 'account'
  const [profileTab, setProfileTab] = useState<'orders' | 'seller' | 'account'>('orders');

  // Filter in "Mis Pedidos"
  const [orderFilter, setOrderFilter] = useState<'all' | 'en_preparacion' | 'despachado' | 'completado'>('all');

  // Selected order for tracking modal
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Re-buy action feedback state
  const [reBuyFeedbackId, setReBuyFeedbackId] = useState<string | null>(null);




  // Buyer Form Data
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || 'Mariano Agustín Gómez',
    email: currentUser?.email || 'marianoagusting1996@gmail.com',
    phone: currentUser?.phone || '11 5590-4421',
    address: currentUser?.address || 'Av. Libertador 2450, Piso 7A',
    city: currentUser?.city || 'Buenos Aires (CABA)',
    postalCode: currentUser?.postalCode || '1425',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    setIsEditing(false);
  };



  const handleReBuy = (product: Product, quantity = 1) => {
    const res = addToCart(product, quantity);
    if (res.success) {
      setReBuyFeedbackId(product.id);
      setTimeout(() => setReBuyFeedbackId(null), 1800);
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);


  const renderOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'en_preparacion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>En preparación en depósito</span>
          </span>
        );
      case 'despachado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Despachado / En camino</span>
          </span>
        );
      case 'completado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Entregado con éxito</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            <X className="w-3.5 h-3.5" />
            <span>Cancelado · reintegro en curso</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      
      {/* Profile Header Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setProfileTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              profileTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Mis Pedidos</span>
            <span
              className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                profileTab === 'orders'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {orders.length}
            </span>
          </button>

          {isMerchant(currentUser) && (
            <button
              onClick={() => setProfileTab('seller')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                profileTab === 'seller'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Mi Tienda</span>
            </button>
          )}

          <button
            onClick={() => setProfileTab('account')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              profileTab === 'account'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Datos & Envío</span>
          </button>

          {isPlatformOwner(currentUser) ? (
            <button
              onClick={() => setCurrentView('admin')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80"
              title="Ver estadísticas y analíticas de ventas"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estadísticas de Ventas</span>
            </button>
          ) : isMerchant(currentUser) ? (
            <button
              onClick={() => setCurrentView('seller-workspace')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80"
              title="Ver estadísticas de tu tienda"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estadísticas de Ventas</span>
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 pr-1 self-end sm:self-auto">
          <button
            onClick={() => setCurrentView('wishlist')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Favoritos ({wishlist.length})</span>
          </button>

          <button
            onClick={logoutUser}
            className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: MIS PEDIDOS (HISTORIAL DETALLADO, RE-BUY & TRACKING) ── */}
      {profileTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Section Title & Status Filters */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display flex items-center gap-2.5">
                  <Package className="w-6 h-6 text-blue-600" />
                  <span>Historial Detallado de Mis Pedidos</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Revisá el estado en tiempo real de tus envíos, volvé a comprar tus productos de outlet o consultá el comprobante.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs text-slate-500 font-medium">Total compras:</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg tabular-nums">
                  {orders.length}
                </span>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filtrar:
              </span>
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({orders.length})
              </button>
              <button
                onClick={() => setOrderFilter('en_preparacion')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === 'en_preparacion'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                En preparación ({orders.filter((o) => o.status === 'en_preparacion').length})
              </button>
              <button
                onClick={() => setOrderFilter('despachado')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === 'despachado'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Despachados ({orders.filter((o) => o.status === 'despachado').length})
              </button>
              <button
                onClick={() => setOrderFilter('completado')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  orderFilter === 'completado'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Entregados ({orders.filter((o) => o.status === 'completado').length})
              </button>
            </div>
          </div>

          {/* Orders Feed */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No hay compras con este filtro
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Descubrí productos de outlet con precios de liquidación y garantía de hasta 90 días.
              </p>
              <button
                onClick={() => setCurrentView('catalog')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="font-mono text-base font-black text-blue-600">
                        {order.orderNumber}
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {renderOrderStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-3.5">
                    {order.items.map((item, idx) => {
                      const conditionStyle = getConditionBadgeStyle(item.product.estado);
                      const isReBought = reBuyFeedbackId === item.product.id;
                      const isOutOfStock = item.product.stock <= 0;

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition-colors"
                        >
                          {/* Left: Product Info */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conditionStyle.bg}`}>
                                  {item.product.estado}
                                </span>
                                <span className="text-xs font-bold text-slate-500 truncate">
                                  {item.product.vendor}
                                </span>
                              </div>

                              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-md">
                                {item.product.title}
                              </h4>

                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>Cantidad: {item.quantity}</span>
                                <span>·</span>
                                <span className="font-bold text-slate-800 tabular-nums">
                                  {formatPrice(item.unitPrice)} c/u
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions (Volver a Comprar & Ver Producto) */}
                          <div className="flex items-center gap-2 sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                            <button
                              type="button"
                              onClick={() => openProductModal(item.product)}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Ver diagnóstico y especificaciones"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Detalles</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReBuy(item.product, 1)}
                              disabled={isOutOfStock}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer ${
                                isOutOfStock
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : isReBought
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isReBought ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>¡Agregado!</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Volver a comprar</span>
                                </>
                              )}
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Order Footer & Action Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    
                    {/* Delivery summary */}
                    <div className="space-y-0.5 text-slate-500">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Destino: {order.customer.address}, {order.customer.city}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.paymentDetails.method === 'mercadopago' && 'Abonado con Mercado Pago'}
                        {order.paymentDetails.method === 'credit_card' && `Abonado con Tarjeta de Crédito (terminada en ${order.paymentDetails.cardLast4 || '4892'})`}
                        {order.paymentDetails.method === 'debit_card' && 'Abonado con Tarjeta de Débito'}
                        {order.paymentDetails.method === 'transfer' && 'Abonado mediante DEBIN / Transferencia'}
                      </div>
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                      <div className="text-right pr-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total abonado</span>
                        <span className="text-lg font-black text-slate-900 font-display tabular-nums">
                          {formatPrice(order.total)}
                        </span>
                      </div>

                      {/* Primary Button: Ver Estado de Envío */}
                      <button
                        type="button"
                        onClick={() => setTrackingOrder(order)}
                        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200/80 shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ver estado de envío</span>
                      </button>

                      {/* Print Ticket Button */}
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                        title="Imprimir comprobante fiscal"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {order.status === 'en_preparacion' && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.id)}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                          title="Cancelar pedido y recuperar el dinero"
                        >
                          Cancelar compra
                        </button>
                      )}
                      {order.status === 'completado' && !order.returnRequested && (
                        <button
                          type="button"
                          onClick={() => requestReturn(order.id)}
                          className="px-3 py-2 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-xs transition-colors cursor-pointer"
                          title="Pedir devolución al vendedor"
                        >
                          Pedir devolución
                        </button>
                      )}
                      {order.returnRequested && (
                        <span className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                          Devolución solicitada
                        </span>
                      )}
                    </div>

                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── TAB 2: ACCESO A PANEL VENDEDOR (solo comercios) ── */}
      {profileTab === 'seller' && isMerchant(currentUser) && (
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 font-extrabold text-base flex items-center justify-center shrink-0">
                  {(currentUser?.storeName || currentUser?.fullName || 'T').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-slate-900">
                    {currentUser?.storeName || 'Mi tienda'}
                  </div>
                  <div className="text-xs text-slate-500">Comercio verificado · Panel vendedor</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('seller-workspace')}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Abrir Mi Tienda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('view-publicar')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  <span>+ Publicar</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Pedidos, stock, equipo, publicidad, integraciones y finanzas, todo desde tu panel de vendedor.
            </p>
          </div>
        </div>
      )}


      {/* ── TAB 3: MIS DATOS & DIRECCIÓN ── */}
      {profileTab === 'account' && (
      <>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Datos Personales y Domicilio de Envío</span>
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Editar</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-4 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  Nombre completo
                </span>
                <span className="font-semibold text-slate-900 text-sm">{formData.fullName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  Dirección de entrega
                </span>
                <span className="font-semibold text-slate-900 text-sm">{formData.address}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  Ciudad y Código Postal
                </span>
                <span className="font-semibold text-slate-900 text-sm">
                  {formData.city} (CP: {formData.postalCode})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                  Teléfono / WhatsApp
                </span>
                <span className="font-semibold text-slate-900 text-sm">{formData.phone}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Dirección (Calle, N°, Piso/Depto)</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Localidad y Código Postal sugerido</label>
                <select
                  onChange={(e) => {
                    const loc = DEFAULT_LOCATIONS.find((l) => `${l.city} (${l.postalCode})` === e.target.value);
                    if (loc) {
                      setFormData({ ...formData, city: loc.city, postalCode: loc.postalCode });
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-blue-600 mb-2"
                >
                  <option value="" disabled>Seleccionar de la lista de localidades y CP de Argentina…</option>
                  {DEFAULT_LOCATIONS.map((loc) => (
                    <option key={`p-${loc.city}-${loc.postalCode}`} value={`${loc.city} (${loc.postalCode})`}>
                      {loc.city} · CP {loc.postalCode} ({loc.province})
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1 mb-3">
                  {POPULAR_LOCATION_SHORTCUTS.slice(0, 4).map((sc) => (
                    <button
                      key={`p-sc-${sc.label}`}
                      type="button"
                      onClick={() => setFormData({ ...formData, city: sc.city, postalCode: sc.postalCode })}
                      className="px-2 py-0.5 rounded-lg text-2xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      {sc.label} ({sc.postalCode})
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    list="user-localities-list"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                  <datalist id="user-localities-list">
                    {DEFAULT_LOCATIONS.map((loc) => (
                      <option key={`udl-${loc.city}`} value={loc.city}>
                        CP {loc.postalCode} - {loc.province}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Código Postal</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Teléfono móvil</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar cambios</span>
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Datos protegidos para tus despachos y compras en solooutlet.</span>
          </div>
        </div>

        {/* Address book */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#004AC6]" />
            <span>Mis direcciones ({(currentUser?.addresses ?? []).length})</span>
          </h2>
          {(currentUser?.addresses ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900">{a.label}</span>
                <span className="text-slate-500"> · {a.address}, {a.city} (CP {a.postalCode}) · {a.phone}</span>
              </div>
              <button onClick={() => removeAddress(a.id)} className="text-rose-500 hover:text-rose-700 font-bold shrink-0 cursor-pointer">
                Quitar
              </button>
            </div>
          ))}
          <div className="space-y-2 text-xs">
            <select
              onChange={(e) => {
                const loc = DEFAULT_LOCATIONS.find((l) => `${l.city} (${l.postalCode})` === e.target.value);
                if (loc) {
                  setNewAddr({ ...newAddr, city: loc.city, postalCode: loc.postalCode });
                }
              }}
              defaultValue=""
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-[#004AC6]"
            >
              <option value="" disabled>Elegir localidad y CP por defecto…</option>
              {DEFAULT_LOCATIONS.map((loc) => (
                <option key={`nb-${loc.city}-${loc.postalCode}`} value={`${loc.city} (${loc.postalCode})`}>
                  {loc.city} · CP {loc.postalCode}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} placeholder="Etiqueta (Casa, Trabajo)" className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6]" />
              <input value={newAddr.fullName} onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })} placeholder="Quien recibe" className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6]" />
              <input value={newAddr.address} onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })} placeholder="Calle, número, piso" className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6]" />
              <input value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} placeholder="Ciudad" className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6]" />
              <input value={newAddr.postalCode} onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })} placeholder="Código postal" className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6]" />
              <input value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} placeholder="Teléfono" className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6]" />
            </div>
          </div>
          <button
            onClick={() => {
              if (!newAddr.address.trim() || !newAddr.city.trim()) return;
              addAddress({
                ...newAddr,
                fullName: newAddr.fullName.trim() || currentUser?.fullName || 'Yo',
                phone: newAddr.phone.trim() || currentUser?.phone || '',
              });
              setNewAddr({ label: 'Casa', fullName: '', phone: '', address: '', city: '', postalCode: '' });
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
          >
            Guardar dirección
          </button>
        </div>
      </>
      )}

      {/* ── TRACKING MODAL: VER ESTADO DE ENVÍO ── */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setTrackingOrder(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                  <Truck className="w-4 h-4" />
                  <span>Seguimiento de Envío en Vivo</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                  Pedido {trackingOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Courier & Tracking Code Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Logística asignada</div>
                <div className="font-bold text-slate-900 text-sm">Andreani Express · solooutlet</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Guía: <span className="font-mono font-bold text-blue-600">AND-{trackingOrder.orderNumber.replace('SO-', '')}-AR</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyTracking(`AND-${trackingOrder.orderNumber.replace('SO-', '')}-AR`)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedTracking ? 'Copiado' : 'Copiar guía'}</span>
              </button>
            </div>

            {/* Visual Timeline Steps */}
            <div className="space-y-6 mb-6">
              
              {/* Step 1 */}
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="w-0.5 h-10 bg-emerald-500 my-0.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Pago confirmado y acreditado</div>
                  <div className="text-[11px] text-slate-500">Transacción validada por Mercado Pago / emisor</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{trackingOrder.date}</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className={`w-0.5 h-10 my-0.5 ${trackingOrder.status === 'en_preparacion' ? 'bg-slate-200' : 'bg-emerald-500'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">2. Embalado y verificado en depósito</div>
                  <div className="text-[11px] text-slate-500">Control de calidad del estado declarado del outlet</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Embalaje reforzado con faja de seguridad</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                      trackingOrder.status === 'en_preparacion'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {trackingOrder.status === 'en_preparacion' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                  </div>
                  <div className={`w-0.5 h-10 my-0.5 ${trackingOrder.status === 'completado' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">3. En tránsito hacia centro de distribución</div>
                  <div className="text-[11px] text-slate-500">
                    {trackingOrder.status === 'en_preparacion'
                      ? 'Despacho programado en las próximas horas'
                      : 'Recibido en planta logística Tronador'}
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      trackingOrder.status === 'completado'
                        ? 'bg-emerald-500 text-white'
                        : trackingOrder.status === 'despachado'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className={`w-0.5 h-10 my-0.5 ${trackingOrder.status === 'completado' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">4. En reparto a tu domicilio</div>
                  <div className="text-[11px] text-slate-500">
                    Destino: {trackingOrder.customer.address}, {trackingOrder.customer.city}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                    Rango estimado: 09:00 a 18:00 hs
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      trackingOrder.status === 'completado'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">5. Entrega completada</div>
                  <div className="text-[11px] text-slate-500">Firma de conformidad y recepción</div>
                </div>
              </div>

            </div>

            {/* Recipient Details & Help */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1 mb-3">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Destinatario:</span>
                <span className="font-semibold">{trackingOrder.customer.fullName}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Contacto de chofer:</span>
                <span className="font-semibold">{trackingOrder.customer.phone}</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs flex items-start gap-2 mb-5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-900">
                <strong>Garantía vigente:</strong> hasta {Math.max(...trackingOrder.items.map((i) => i.product.warrantyDays || 30))} días por el estado declarado. Si no coincide, tenés 10 días de prueba para cambio o devolución.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setTrackingOrder(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cerrar seguimiento
            </button>

          </div>
        </div>
      )}

          </div>
  );
};
