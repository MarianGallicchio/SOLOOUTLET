import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/formatters';
import { CheckCircle2, Package, Truck, ArrowRight, Printer, Share2, ShieldCheck } from 'lucide-react';

export const OrderSuccessView: React.FC = () => {
  const { lastOrder, setCurrentView } = useStore();

  if (!lastOrder) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold mb-3">No hay un pedido reciente</h2>
        <button
          onClick={() => setCurrentView('catalog')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Ir al catálogo
        </button>
      </div>
    );
  }

  const order = lastOrder;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      
      {/* Success Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden relative">
        
        {/* Top Celebration */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            ¡Pago Acreditado con Éxito!
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 font-display">
            ¡Gracias por tu compra, {order.customer.fullName.split(' ')[0]}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tu pedido <span className="font-mono font-bold text-blue-600">{order.orderNumber}</span> ya fue recibido por el comercio y está siendo preparado para despacho.
          </p>
        </div>

        {/* Status Tracker */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-3">
            <span className="flex items-center gap-1.5 text-blue-600">
              <Package className="w-4 h-4" />
              <span>1. Pago Acreditado</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              <Truck className="w-4 h-4" />
              <span>2. En preparación de despacho</span>
            </span>
            <span className="text-slate-400">
              3. En camino a tu domicilio
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-2/3 rounded-full animate-pulse" />
          </div>
          <div className="text-[11px] text-slate-500 mt-2 text-center">
            Tiempo estimado de entrega: 24 a 48 hs hábiles en {order.customer.city}
          </div>
        </div>

        {/* Order Details Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 pb-6 border-b border-slate-200 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
              Datos de Entrega:
            </h4>
            <div className="space-y-1 text-slate-600">
              <p className="font-medium text-slate-900">{order.customer.fullName}</p>
              <p>{order.customer.address}</p>
              <p>{order.customer.city} (CP: {order.customer.postalCode})</p>
              <p>Contacto: {order.customer.phone}</p>
              <p className="text-slate-500">{order.customer.email}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
              Método de Pago Utilizado:
            </h4>
            <div className="space-y-1.5 text-slate-600">
              {order.paymentDetails.method === 'mercadopago' && (
                <div className="p-2.5 rounded-xl bg-[#009EE3]/10 border border-[#009EE3]/30 text-slate-800">
                  <div className="font-bold text-[#009EE3]">Mercado Pago Aprobado</div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    Comprobante: {order.paymentDetails.mpTransactionId}
                  </div>
                </div>
              )}
              {order.paymentDetails.method === 'credit_card' && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-slate-800">
                  <div className="font-bold text-blue-700">
                    Tarjeta terminada en {order.paymentDetails.cardLast4}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {order.paymentDetails.installments} cuotas de {formatPrice(order.paymentDetails.installmentAmount || 0)}
                  </div>
                </div>
              )}
              {order.paymentDetails.method === 'debit_card' && (
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                  <div className="font-bold text-slate-800">
                    Tarjeta de Débito terminada en {order.paymentDetails.cardLast4}
                  </div>
                  <div className="text-[11px] text-slate-500">1 pago directo</div>
                </div>
              )}
              {order.paymentDetails.method === 'transfer' && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-800">
                  <div className="font-bold text-emerald-700">DEBIN / Transferencia Bancaria</div>
                  <div className="text-[11px] text-emerald-800">Bonificación del 10% aplicada</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized List */}
        <div className="py-6 border-b border-slate-200">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
            Productos incluidos en este envío:
          </h4>
          <div className="space-y-2.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{item.product.title}</div>
                    <div className="text-slate-500">
                      Estado: {item.product.estado} · Cantidad: {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-slate-900 tabular-nums">
                  {formatPrice(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="tabular-nums font-semibold">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento transferencia:</span>
                <span className="tabular-nums font-semibold">- {formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Envío:</span>
              <span className="tabular-nums font-semibold">{order.shipping === 0 ? 'Gratis' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Abonado:</span>
              <span className="text-xl text-blue-600 font-display tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Factura electrónica A/B enviada a {order.customer.email}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir comprobante</span>
            </button>

            <button
              onClick={() => setCurrentView('catalog')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <span>Seguir comprando</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
