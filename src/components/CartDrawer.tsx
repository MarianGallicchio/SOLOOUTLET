import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice, getConditionBadgeStyle } from '../utils/formatters';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateCartQty, setIsCheckoutOpen, setCurrentView } = useStore();

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 150000;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const diffToFreeShipping = freeShippingThreshold - subtotal;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleGoToCatalog = () => {
    setIsCartOpen(false);
    setCurrentView('catalog');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 ease-out">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Mi Carrito ({cart.reduce((a, b) => a + b.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="px-5 py-3 bg-blue-50/70 border-b border-blue-100 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                {diffToFreeShipping <= 0 ? (
                  <span className="text-emerald-700 font-bold">¡Envío gratis desbloqueado!</span>
                ) : (
                  <span>
                    Te faltan <span className="text-blue-700 font-bold">{formatPrice(diffToFreeShipping)}</span> para envío gratis
                  </span>
                )}
              </span>
              <span className="font-bold text-blue-700">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Tu carrito está vacío
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Descubrí cientos de productos de primeras marcas a precios de liquidación con garantía.
                </p>
                <button
                  onClick={handleGoToCatalog}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Explorar catálogo de outlet
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const conditionStyle = getConditionBadgeStyle(item.product.estado);
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conditionStyle.bg}`}>
                            {item.product.estado}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            aria-label={`Eliminar ${item.product.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-1">
                          {item.product.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.product.vendor}
                        </div>
                      </div>

                      {/* Stepper and Price */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200 font-bold disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 tabular-nums">
                            {formatPrice(item.product.price * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-[10px] text-slate-400 tabular-nums">
                              {formatPrice(item.product.price)} c/u
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50/60 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Envío estimado:</span>
                  <span className="tabular-nums font-semibold text-emerald-700">
                    {diffToFreeShipping <= 0 ? 'Gratis' : '$ 7.500'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total estimado:</span>
                  <span className="text-base text-blue-600 tabular-nums font-display">
                    {formatPrice(diffToFreeShipping <= 0 ? subtotal : subtotal + 7500)}
                  </span>
                </div>
              </div>

              {/* Payment methods badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Mercado Pago & Tarjetas
                </span>
                <span className="font-bold text-blue-700">3 cuotas sin interés</span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuar con el pago</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
