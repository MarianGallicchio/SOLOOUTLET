import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { CustomerData, PaymentDetails, PaymentMethodType, ShippingOption } from '../types';
import { formatPrice } from '../utils/formatters';
import { SHIPPING_OPTIONS, resolveCoupon, resolveShipping } from '../utils/commissions';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  MapPin,
} from 'lucide-react';
import { DEFAULT_LOCATIONS, POPULAR_LOCATION_SHORTCUTS } from '../data/locations';

export const CheckoutModal: React.FC = () => {
  const { cart, isCheckoutOpen, setIsCheckoutOpen, processCheckout, currentUser } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('mercadopago');
  const [shippingOption, setShippingOption] = useState<ShippingOption>('standard');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);

  // Customer form state
  const [customer, setCustomer] = useState<CustomerData>({
    fullName: 'Mariano Agustín Gómez',
    email: 'marianoagusting1996@gmail.com',
    phone: '11 5590-4421',
    address: 'Av. Libertador 2450, Piso 7A',
    city: 'Buenos Aires (CABA)',
    postalCode: '1425',
  });

  // Credit/Debit Card form state
  const [card, setCard] = useState({
    number: '4509 2384 9912 4892',
    name: 'MARIANO A GOMEZ',
    expiry: '08/29',
    cvv: '892',
    dni: '39.812.441',
    installments: 3,
  });

  if (!isCheckoutOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const transferDiscount = paymentMethod === 'transfer' ? Math.round(subtotal * 0.1) : 0;
  const coupon = appliedCoupon ? resolveCoupon(appliedCoupon, subtotal) : null;
  const couponDiscount = coupon?.amount ?? 0;
  const discountTotal = transferDiscount + couponDiscount;
  const surchargeRate = paymentMethod === 'credit_card' ? (card.installments >= 12 ? 0.3 : card.installments >= 6 ? 0.15 : 0) : 0;
  const surcharge = Math.round((subtotal - discountTotal) * surchargeRate);
  const shipping = resolveShipping(shippingOption, subtotal);
  const total = subtotal - discountTotal + surcharge + shipping;

  const installmentAmount = Math.round(total / card.installments);

  const handleApplyCoupon = () => {
    const found = resolveCoupon(couponInput, subtotal);
    if (!found) {
      setCouponError('Cupón inválido o no alcanza el mínimo. Probá OUTLET10.');
      return;
    }
    setAppliedCoupon(found.code);
    setCouponError(null);
    setCouponInput('');
  };

  const handleCopyAlias = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
      cardLast4: paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
        ? card.number.replace(/\s/g, '').slice(-4)
        : undefined,
      installments: paymentMethod === 'credit_card' ? card.installments : 1,
      installmentAmount: paymentMethod === 'credit_card' ? installmentAmount : total,
      mpTransactionId: paymentMethod === 'mercadopago' ? `MP-${Math.floor(100000000 + Math.random() * 900000000)}` : undefined,
      bankAlias: paymentMethod === 'transfer' ? 'SOLOOUTLET.OFICIAL' : undefined,
      shippingOption,
      couponCode: coupon?.code,
    };

    setTimeout(() => {
      processCheckout(customer, paymentDetails, coupon?.code);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={() => !isProcessing && setIsCheckoutOpen(false)}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-8 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold tracking-tight">Checkout Seguro · solooutlet</span>
          </div>
          <button
            onClick={() => !isProcessing && setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-12 max-h-[85vh] overflow-y-auto">
          
          {/* Left Column: Contact, Shipping & Payment Methods */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200">
            
            {/* Step 1: Customer details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[11px] font-extrabold">1</span>
                <span>Datos del Comprador y Envío</span>
              </h3>

              {(currentUser?.addresses?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Usar dirección guardada</label>
                  <select
                    onChange={(e) => {
                      const a = currentUser?.addresses?.find((x) => x.id === e.target.value);
                      if (a) setCustomer({ fullName: a.fullName, email: customer.email, phone: a.phone, address: a.address, city: a.city, postalCode: a.postalCode });
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6] font-medium bg-white"
                  >
                    <option value="" disabled>Elegir dirección…</option>
                    {currentUser?.addresses?.map((a) => (
                      <option key={a.id} value={a.id}>{a.label} · {a.address}, {a.city}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    required
                    value={customer.fullName}
                    onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email para el comprobante *</label>
                  <input
                    type="email"
                    required
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Dirección de entrega *</label>
                  <input
                    type="text"
                    required
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Calle, Número, Piso/Depto"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Localidad y Código Postal por defecto</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Autocompleta Ciudad y CP</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const loc = DEFAULT_LOCATIONS.find((l) => `${l.city} (${l.postalCode})` === e.target.value);
                      if (loc) {
                        setCustomer({ ...customer, city: loc.city, postalCode: loc.postalCode });
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:outline-none focus:border-blue-600 font-medium text-slate-700 cursor-pointer transition-colors"
                  >
                    <option value="" disabled>Seleccionar de la lista de localidades y CP…</option>
                    {DEFAULT_LOCATIONS.map((loc) => (
                      <option key={`${loc.city}-${loc.postalCode}`} value={`${loc.city} (${loc.postalCode})`}>
                        {loc.city} · CP {loc.postalCode} ({loc.province})
                      </option>
                    ))}
                  </select>

                  {/* Quick Shortcut Buttons for fast selection */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Frecuentes:</span>
                    {POPULAR_LOCATION_SHORTCUTS.map((sc) => (
                      <button
                        key={sc.label}
                        type="button"
                        onClick={() => setCustomer({ ...customer, city: sc.city, postalCode: sc.postalCode })}
                        className={`px-2 py-0.5 rounded-lg text-2xs font-semibold border transition-all cursor-pointer ${
                          customer.postalCode === sc.postalCode
                            ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {sc.label} <span className="opacity-70 font-mono">({sc.postalCode})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Ciudad / Localidad *</label>
                  <input
                    type="text"
                    required
                    list="checkout-localities-list"
                    value={customer.city}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Detect if matches any preset to autofill postal code
                      const matched = DEFAULT_LOCATIONS.find((l) => l.city.toLowerCase() === val.toLowerCase());
                      if (matched) {
                        setCustomer({ ...customer, city: matched.city, postalCode: matched.postalCode });
                      } else {
                        setCustomer({ ...customer, city: val });
                      }
                    }}
                    placeholder="Ej: Buenos Aires (CABA - Palermo)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                  />
                  <datalist id="checkout-localities-list">
                    {DEFAULT_LOCATIONS.map((loc) => (
                      <option key={`dl-${loc.city}`} value={loc.city}>
                        CP {loc.postalCode} - {loc.province}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Código Postal *</label>
                  <input
                    type="text"
                    required
                    value={customer.postalCode}
                    onChange={(e) => {
                      const cp = e.target.value;
                      const matched = DEFAULT_LOCATIONS.find((l) => l.postalCode === cp.trim());
                      if (matched && !customer.city) {
                        setCustomer({ ...customer, postalCode: cp, city: matched.city });
                      } else {
                        setCustomer({ ...customer, postalCode: cp });
                      }
                    }}
                    placeholder="Ej: 1425"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[11px] font-extrabold">2</span>
                <span>Seleccionar Método de Pago</span>
              </h3>

              {/* Payment Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                
                {/* Mercado Pago */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'mercadopago'
                      ? 'border-[#009EE3] bg-[#009EE3]/10 ring-2 ring-[#009EE3]/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-[#009EE3] text-white flex items-center justify-center text-xs font-black mb-2">
                    MP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">Mercado Pago</div>
                    <div className="text-[10px] text-slate-500">QR o saldo</div>
                  </div>
                </button>

                {/* Crédito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'credit_card'
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-blue-600 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">Crédito</div>
                    <div className="text-[10px] text-emerald-600 font-bold">3 cuotas s/interés</div>
                  </div>
                </button>

                {/* Débito */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit_card')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'debit_card'
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-slate-700 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">Débito</div>
                    <div className="text-[10px] text-slate-500">1 pago directo</div>
                  </div>
                </button>

                {/* Transferencia */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'transfer'
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-6 h-6 text-emerald-600 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">DEBIN / Transf.</div>
                    <div className="text-[10px] text-emerald-700 font-bold">10% OFF EXTRA</div>
                  </div>
                </button>

              </div>

              {/* Dynamic Payment Specific Body */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                
                {/* 1. Mercado Pago Details */}
                {paymentMethod === 'mercadopago' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[#009EE3]" />
                        <span>Pago inmediato con Mercado Pago</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#009EE3] bg-[#009EE3]/10 px-2 py-0.5 rounded">
                        Acreditación instantánea
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
                      {/* Interactive QR Simulation */}
                      <div className="w-28 h-28 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <QrCode className="w-20 h-20 text-white" />
                        <span className="text-[8px] text-blue-300 uppercase tracking-wider font-mono">
                          QR MP-OFICIAL
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1.5">
                        <p className="font-semibold text-slate-900">
                          1. Abrí la app de Mercado Pago en tu teléfono.
                        </p>
                        <p>2. Escaneá este código QR o usá el dinero disponible en tu cuenta.</p>
                        <p className="text-[11px] text-slate-500">
                          También podés pagar con tarjetas guardadas en tu billetera MP.
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Alias: SOLO.OUTLET.MP
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyAlias('SOLO.OUTLET.MP')}
                            className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                          >
                            {copiedAlias ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedAlias ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Tarjeta de Crédito */}
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Tarjeta de Crédito</span>
                      <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                        Visa, Mastercard, Amex, Cabal
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Número de tarjeta
                        </label>
                        <input
                          type="text"
                          required
                          value={card.number}
                          onChange={(e) => setCard({ ...card, number: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tracking-wider focus:outline-none focus:border-blue-600 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Nombre como figura en tarjeta
                          </label>
                          <input
                            type="text"
                            required
                            value={card.name}
                            onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            DNI del titular
                          </label>
                          <input
                            type="text"
                            required
                            value={card.dni}
                            onChange={(e) => setCard({ ...card, dni: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Vencimiento (MM/AA)
                          </label>
                          <input
                            type="text"
                            required
                            value={card.expiry}
                            onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-blue-600 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Código de seguridad (CVV)
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={card.cvv}
                            onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-blue-600 bg-white"
                          />
                        </div>
                      </div>

                      {/* Cuotas Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Planes de financiación en cuotas:
                        </label>
                        <select
                          value={card.installments}
                          onChange={(e) => setCard({ ...card, installments: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-blue-400 bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={1}>1 cuota de {formatPrice(total)} (Mismo precio)</option>
                          <option value={3}>
                            ⭐ 3 cuotas SIN INTERÉS de {formatPrice(Math.round(total / 3))}
                          </option>
                          <option value={6}>6 cuotas fijas de {formatPrice(Math.round((total * 1.15) / 6))}</option>
                          <option value={12}>12 cuotas fijas de {formatPrice(Math.round((total * 1.30) / 12))}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Tarjeta de Débito */}
                {paymentMethod === 'debit_card' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-800">Tarjeta de Débito (1 pago)</div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Número de tarjeta de débito
                        </label>
                        <input
                          type="text"
                          required
                          value={card.number}
                          onChange={(e) => setCard({ ...card, number: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono tracking-wider focus:outline-none focus:border-blue-600 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Vencimiento (MM/AA)
                          </label>
                          <input
                            type="text"
                            required
                            value={card.expiry}
                            onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-blue-600 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={card.cvv}
                            onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-blue-600 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Transferencia / DEBIN */}
                {paymentMethod === 'transfer' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800">Transferencia Bancaria o DEBIN</span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        10% de Ahorro Extra
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Banco:</span>
                        <span className="font-bold">Banco Santander Río</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Titular:</span>
                        <span className="font-bold">SOLO OUTLET S.A.</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Alias CBU:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-700">SOLOOUTLET.OFICIAL</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAlias('SOLOOUTLET.OFICIAL')}
                            className="text-emerald-700 hover:text-emerald-800 p-1"
                          >
                            {copiedAlias ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 pt-1">
                        Tu pedido se procesa de forma inmediata al confirmar la operación.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Confirm Button */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/80 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Resumen de tu pedido ({cart.reduce((a, b) => a + b.quantity, 0)} ítems)
              </h3>

              {/* Items mini list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 mb-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {item.quantity}
                      </span>
                      <span className="truncate font-medium text-slate-800">
                        {item.product.title}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping options */}
              <div className="space-y-2 mb-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Envío</div>
                {(Object.keys(SHIPPING_OPTIONS) as ShippingOption[]).map((opt) => {
                  const info = SHIPPING_OPTIONS[opt];
                  const cost = resolveShipping(opt, subtotal);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setShippingOption(opt)}
                      className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        shippingOption === opt
                          ? 'border-[#004AC6] bg-blue-50/60 ring-1 ring-[#004AC6]/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        <span className="block text-xs font-bold text-slate-900">{info.label}</span>
                        <span className="block text-[11px] text-slate-500">{info.eta}</span>
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${cost === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {cost === 0 ? 'Gratis' : formatPrice(cost)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="mb-3">
                {coupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-800">🎟 {coupon.code} · {coupon.label}</span>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="text-slate-500 hover:text-rose-600 font-bold cursor-pointer">Quitar</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-1.5">
                      <input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                        placeholder="Cupón (ej: OUTLET10)"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#004AC6] uppercase font-mono"
                      />
                      <button type="button" onClick={handleApplyCoupon} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer">
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {transferDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Bonificación transferencia (10%):</span>
                    <span className="tabular-nums">- {formatPrice(transferDiscount)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Cupón {coupon?.code}:</span>
                    <span className="tabular-nums">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}

                {surcharge > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Recargo financiación ({card.installments} cuotas):</span>
                    <span className="tabular-nums font-semibold">+ {formatPrice(surcharge)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Envío {shippingOption === 'express' ? 'expreso' : 'estándar'}:</span>
                  <span className="tabular-nums font-semibold text-emerald-700">
                    {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                  </span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total a pagar:</span>
                  <span className="text-xl text-blue-600 tabular-nums font-display">
                    {formatPrice(total)}
                  </span>
                </div>

                {paymentMethod === 'credit_card' && card.installments > 1 && (
                  <div className="text-right text-[11px] font-semibold text-emerald-700">
                    en {card.installments} cuotas de {formatPrice(installmentAmount)}{surcharge === 0 ? ' sin interés' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Guarantees and Submit CTA */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Compra protegida por Garantía Oficial solooutlet de 30 a 90 días.</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validando pago con {paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'el emisor'}...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar y Pagar {formatPrice(total)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};
