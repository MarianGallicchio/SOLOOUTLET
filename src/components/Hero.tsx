import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatPrice, getGradeForCondition, getGradeChipStyle } from '../utils/formatters';
import { BadgeCheck, Camera, Truck, ShieldCheck, TrendingUp, ScrollText, Zap, ZoomIn, ShoppingCart } from 'lucide-react';

export const Hero: React.FC = () => {
  const { setCurrentView, openProductModal, addToCart, products } = useStore();
  const auditProduct = products[0];
  const grade = auditProduct ? getGradeForCondition(auditProduct.estado) : 'Grado B';
  const gradeStyle = getGradeChipStyle(grade);

  const scrollToGrades = () => {
    document.getElementById('grados')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 mb-5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 badge-pulse" />
              <span>142 unidades liquidadas en las últimas 3 horas</span>
              <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.08] mb-4 font-display">
              Oportunidades únicas con{' '}
              <span className="text-[#004AC6] underline decoration-[#004AC6]/30">transparencia total.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-7">
              Comprá devoluciones comerciales, cajas abiertas y productos con detalles estéticos mínimos
              certificados por peritos técnicos con hasta un{' '}
              <span className="font-extrabold text-orange-600">75% de ahorro real.</span>
            </p>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-7">
              <button
                onClick={() => setCurrentView('catalog')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-orange-600 text-white font-bold text-sm sm:text-base hover:bg-orange-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Explorar Liquidaciones Hoy</span>
              </button>
              <button
                onClick={scrollToGrades}
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold text-sm sm:text-base hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ScrollText className="w-4 h-4 text-[#004AC6]" />
                <span>Entender Sistema de Grados</span>
              </button>
            </div>

            {/* Trust mini-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              {[
                { icon: <Camera className="w-4 h-4 text-[#004AC6]" />, label: 'Fotos reales 100%' },
                { icon: <BadgeCheck className="w-4 h-4 text-emerald-600" />, label: '30 días cambio' },
                { icon: <Truck className="w-4 h-4 text-[#004AC6]" />, label: 'Despacho en 24h' },
                { icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, label: 'Mercado Pago' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700">
                  {t.icon}
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: audit card */}
          {auditProduct && (
            <div className="lg:col-span-5">
              <div className="relative max-w-md mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-xl">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold whitespace-nowrap">
                  <BadgeCheck className="w-3.5 h-3.5" /> PERITAJE OFICIAL OK
                </div>
                <div className="relative h-56 rounded-xl overflow-hidden bg-slate-100 mt-2">
                  <img
                    src={auditProduct.image}
                    alt={auditProduct.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 text-white text-[11px] font-semibold truncate">
                    Falla: {auditProduct.conditionDetails.slice(0, 80)}…
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${gradeStyle.pill}`}>
                    {grade}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-orange-600 text-white text-[11px] font-extrabold">
                    -{auditProduct.discount}% OFF
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through tabular-nums">
                    {formatPrice(auditProduct.originalPrice)}
                  </span>
                  <span className="text-2xl font-black text-orange-600 tabular-nums">
                    {formatPrice(auditProduct.price)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => openProductModal(auditProduct)}
                    className="px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" /> Ver Defecto
                  </button>
                  <button
                    onClick={() => addToCart(auditProduct, 1)}
                    className="px-3 py-2.5 rounded-xl bg-[#004AC6] text-white text-xs font-bold hover:bg-[#1D4ED8] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" /> Comprar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
