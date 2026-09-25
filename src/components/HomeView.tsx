import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Hero } from './Hero';
import { ProductCard } from './ProductCard';
import { ArrowRight, ShieldCheck, Truck, CreditCard, Store, AlarmClock, BadgeCheck, Info, PackagePlus } from 'lucide-react';

const useCountdown = () => {
  const [seconds, setSeconds] = useState(4 * 3600 + 27 * 60 + 58);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 4 * 3600 + 27 * 60 + 58)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const GRADES = [
  {
    grade: 'Grado A',
    title: 'Como Nuevo / Caja Abierta',
    off: '25% a 40% OFF',
    desc: 'Devoluciones de menos de 14 días, estética 10/10 impecable, batería 99%-100%.',
    checks: ['Estética: 10/10 impecable', 'Batería: 99%-100%', 'Garantía: 6 a 12 meses'],
    pill: 'bg-emerald-100 text-emerald-800',
    filter: 'Devolución',
  },
  {
    grade: 'Grado B',
    title: 'Detalle Estético Leve',
    off: '40% a 60% OFF',
    desc: 'Microrrayones o marcas mínimas. Funciona al 90%+ del original.',
    checks: ['Estética: 8.5/10 (micromarca)', 'Rendimiento: +90% original', 'Garantía: 90 días'],
    pill: 'bg-amber-100 text-amber-800',
    filter: 'Rayado',
  },
  {
    grade: 'Grado C',
    title: 'Reacondicionado Funcional',
    off: '50% a 75% OFF',
    desc: 'Estética 7/10 visible, rendimiento 100% probado por servicio técnico.',
    checks: ['Estética: 7/10 visible', 'Rendimiento: 100% probado', 'Garantía: 30 a 60 días'],
    pill: 'bg-indigo-100 text-indigo-800',
    filter: 'Reacondicionado',
  },
  {
    grade: 'Lotes B2B',
    title: 'Pallets & Cajas Mixtas',
    off: 'Hasta 85% OFF',
    desc: 'Manifiesto de carga completo para comercios y distribuidores.',
    checks: ['Volumen: 10 a +200 u.', 'Retiro logístico 48hs', 'Factura A disponible'],
    pill: 'bg-slate-200 text-slate-800',
    filter: null as string | null,
  },
] as const;

export const HomeView: React.FC = () => {
  const { products, setCurrentView, goToStateFilter } = useStore();
  const countdown = useCountdown();

  const featuredProducts = products.slice(0, 8);
  const topDiscount = [...products].sort((a, b) => b.discount - a.discount).slice(0, 4);

  return (
    <div>
      <Hero />

      {/* Countdown strip — Stitch */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 px-3.5 py-2 rounded-xl text-xs font-bold text-orange-700">
          <AlarmClock className="w-4 h-4 animate-pulse" />
          <span>Cierre de lote en <span className="font-mono tabular-nums">{countdown}</span> · ¡Solo quedan pocas unidades!</span>
        </div>
      </div>

      {/* Featured Outlet Products */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
              Rayos del Día
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Últimas oportunidades
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Publicaciones recién agregadas por comercios y distribuidores verificados.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('catalog')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#004AC6] hover:text-[#1D4ED8] group transition-colors cursor-pointer shrink-0"
          >
            <span>Ver todo el catálogo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Mayor descuento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-3xl bg-slate-950 text-white p-6 sm:p-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
                Hasta 75% OFF
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
                Los de mayor descuento
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('catalog')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-300 hover:text-orange-200 cursor-pointer shrink-0"
            >
              <span>Ver todo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {topDiscount.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Grados — Stitch */}
      <section id="grados" className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-[#004AC6] text-[11px] font-extrabold uppercase tracking-wider mb-3">
              Transparencia Radical
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Sistema de Grados solooutlet
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Cada producto se perita y se clasifica. Sabés exactamente qué comprás.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GRADES.map((g) => (
              <div key={g.grade} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
                <span className={`self-start px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${g.pill}`}>
                  {g.grade}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{g.title}</h3>
                <div className="text-xs font-extrabold text-orange-600 mt-0.5">{g.off}</div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{g.desc}</p>
                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-700">
                  {g.checks.map((c) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => (g.filter ? goToStateFilter(g.filter) : setCurrentView('vender'))}
                  className="mt-4 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  {g.filter ? `Filtrar ${g.grade}` : 'Consultar Pallets'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Cómo funciona solooutlet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Un modelo pensado para conectar el stock dormido de las marcas con consumidores inteligentes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#004AC6] flex items-center justify-center font-bold text-xl mb-4">
                🔍
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                1. Explorá con filtros reales
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Filtrá por estado del producto: devolución, rayado, sin caja o con falla. Sabés exactamente qué comprás desde el primer clic sin sorpresas.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4">
                💸
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                2. Precios de liquidación real
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Los comercios fijan precios por debajo del mercado para liquidar su stock acumulado. Descuentos genuinos del 25% al 70% OFF.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl mb-4">
                🛡️
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                3. Comprás directo con garantía
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pagá con Mercado Pago o tarjetas en cuotas. El comercio despacha en 24 horas y contás con la protección de garantía oficial solooutlet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B Banner — Stitch dark */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-10">
          <span className="inline-block px-3 py-1 rounded-full bg-[#004AC6] text-white text-[11px] font-extrabold uppercase tracking-wider mb-3">
            Portal de empresas y distribuidores
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 font-display">
            ¿Tenés mercadería inmovilizada o devoluciones en tu bodega?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Liquidá inventario ocioso con manifiesto de carga completo en menos de 48 horas, con retiro logístico y factura A.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setCurrentView('vender')}
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" /> Vender Stock Inmovilizado
            </button>
            <button
              onClick={() => setCurrentView('view-publicar')}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              Publicar Lote
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Grid */}
      <section className="bg-slate-100/70 border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-[#004AC6] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Envío Rápido</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Despacho en 24hs a todo el país.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#004AC6] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Garantía Declarada</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Hasta 90 días en todos los productos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-[#004AC6] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Mercado Pago & Cuotas</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Hasta 3 cuotas sin interés y DEBIN.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-[#004AC6] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Comercios Verificados</h4>
                <p className="text-[11px] text-slate-500 leading-tight">Auditoría previa de cada publicación.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-start gap-2 text-[11px] text-slate-500">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>SoloOutlet retiene automáticamente la comisión de cada venta y transfiere el neto al vendedor. Ver panel Admin → Liquidaciones y comisiones.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
