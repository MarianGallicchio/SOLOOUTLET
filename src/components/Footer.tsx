import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { isMerchant, isPlatformOwner } from '../utils/sellerWorkspace';
import { persist, load } from '../data/db';
import {
  Package, Mail, Facebook, Instagram, Twitter, Youtube,
  Check, MessageCircle,
} from 'lucide-react';
import { PaymentBadges } from './PaymentIcons';

const NEWSLETTER_KEY = 'solooutlet_newsletter';

export const Footer: React.FC = () => {
  const { setCurrentView, setHelpSection, currentUser, openAuthModal, triggerPushNotification } = useStore();
  const seller = isMerchant(currentUser);
  // La zona Comercios (accesos rápidos de venta) solo la ve quien tiene cuenta comercio.
  // El comprador común solo ve Compradores + Ayuda + Confianza.
  const showComercios = seller || isPlatformOwner(currentUser);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const goHelp = (section: 'garantia' | 'envios' | 'terminos') => {
    setHelpSection(section);
    setCurrentView('ayuda');
  };

  const goPublish = () => {
    if (seller) setCurrentView('view-publicar');
    else setCurrentView('vender');
  };

  const goAdminPanel = () => {
    if (isPlatformOwner(currentUser)) setCurrentView('admin');
    else if (seller) setCurrentView('seller-workspace');
    else openAuthModal('merchant');
  };

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setEmailError('Ingresá un email válido.');
      return;
    }
    const list = load<string[]>(NEWSLETTER_KEY, []);
    if (list.includes(value)) {
      setEmailError('Ese email ya está suscripto.');
      return;
    }
    persist(NEWSLETTER_KEY, [...list, value]);
    setEmail('');
    setEmailError(null);
    triggerPushNotification({
      type: 'system',
      title: '🎟 Newsletter activado',
      body: 'Vas a recibir las liquidaciones con mayor descuento antes que nadie.',
      linkView: 'catalog',
    });
  };

  const socialSoon = (red: string) => {
    triggerPushNotification({
      type: 'system',
      title: `📣 ${red} oficial en preparación`,
      body: 'Te avisamos por acá cuando lancemos nuestras redes.',
      linkView: 'home',
    });
  };

  const linkCls = 'hover:text-[#004AC6] transition-colors cursor-pointer text-left';

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

        {/* Newsletter + redes */}
        <div className="bg-slate-100/80 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 mb-1">¡Suscribite a nuestro Newsletter!</h4>
            <form onSubmit={subscribe} className="mt-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                  placeholder="¡Ingresá tu e-mail!"
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#004AC6] font-medium"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Mail className="w-4 h-4" />
                  <span>Recibir ofertas</span>
                </button>
              </div>
              {emailError && <p className="text-[11px] text-rose-600 mt-1.5">{emailError}</p>}
            </form>
          </div>
          <div className="md:pl-6 md:border-l md:border-slate-200">
            <h4 className="text-sm font-extrabold text-slate-900 mb-3">Seguinos en nuestras redes</h4>
            <div className="flex items-center gap-2.5">
              {[
                { name: 'Facebook', icon: <Facebook className="w-4 h-4" />, cls: 'bg-[#1877F2] hover:bg-[#1464cc]' },
                { name: 'Instagram', icon: <Instagram className="w-4 h-4" />, cls: 'bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 hover:opacity-90' },
                { name: 'X', icon: <Twitter className="w-4 h-4" />, cls: 'bg-sky-500 hover:bg-sky-600' },
                { name: 'YouTube', icon: <Youtube className="w-4 h-4" />, cls: 'bg-red-600 hover:bg-red-700' },
              ].map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => socialSoon(s.name)}
                  title={s.name}
                  className={`w-9 h-9 rounded-full text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer ${s.cls}`}
                >
                  {s.icon}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Liquidaciones flash y lotes nuevos, primero por ahí.</p>
          </div>
        </div>

        <div className={`grid grid-cols-2 ${showComercios ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-8 mb-10`}>

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#004AC6] flex items-center justify-center text-white">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 font-display">
                solo<span className="text-[#004AC6]">outlet</span>
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              El marketplace donde el stock de devoluciones comerciales, productos sin caja o con detalles de fábrica encuentra compradores que buscan precios de liquidación con fotos reales.
            </p>
          </div>

          {/* Compradores */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Compradores</h5>
            <ul className="space-y-1.5">
              <li><button onClick={() => setCurrentView('catalog')} className={linkCls}>Explorar Catálogo</button></li>
              <li><button onClick={() => setCurrentView('catalog')} className={linkCls}>Últimas oportunidades</button></li>
              <li><button onClick={() => goHelp('garantia')} className={linkCls}>Venta final y garantía del fabricante</button></li>
              <li><button onClick={() => goHelp('envios')} className={linkCls}>Seguimiento de envíos</button></li>
            </ul>
          </div>

          {/* Comercios — OCULTA para el comprador común: solo cuentas comercio */}
          {showComercios && (
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Comercios</h5>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={goPublish} className={`${linkCls} font-semibold text-[#004AC6]`}>
                    Publicar producto (Asistente 4 pasos)
                  </button>
                </li>
                <li><button onClick={() => setCurrentView('vender')} className={linkCls}>Vender stock y devoluciones</button></li>
                <li><button onClick={() => setCurrentView('vender')} className={linkCls}>Simulador de comisiones</button></li>
                <li>
                  <button onClick={goAdminPanel} className={`${linkCls} font-semibold text-[#004AC6]`}>
                    Panel de administración y ventas
                  </button>
                </li>
                <li>
                  <button onClick={() => (seller ? setCurrentView('seller-workspace') : openAuthModal('merchant'))} className={linkCls}>
                    {seller ? 'Acceder a mi tienda' : 'Acceso vendedores'}
                  </button>
                </li>
                <li><button onClick={() => goHelp('terminos')} className={linkCls}>Términos de servicio para comercios</button></li>
              </ul>
            </div>
          )}

          {/* Ayuda */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Centro de ayuda</h5>
            <ul className="space-y-1.5">
              <li><button onClick={() => goHelp('garantia')} className={linkCls}>Preguntas frecuentes</button></li>
              <li><button onClick={() => goHelp('garantia')} className={linkCls}>Política de venta final</button></li>
              <li><button onClick={() => goHelp('terminos')} className={linkCls}>Términos y condiciones</button></li>
              <li>
                <a
                  href="https://wa.me/5491155904420?text=Hola,%20necesito%20ayuda%20con%20mi%20compra%20en%20solooutlet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkCls} inline-flex items-center gap-1 font-semibold text-emerald-700`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp de ayuda
                </a>
              </li>
              <li>
                <a href="mailto:comercios@solooutlet.com.ar" className={linkCls}>
                  comercios@solooutlet.com.ar
                </a>
              </li>
            </ul>
          </div>

          {/* Confianza */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Comprá con tranquilidad</h5>
            <ul className="space-y-1.5 text-[11px] text-slate-500">
              <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" /><span>Fotos 100% reales del lote que recibís.</span></li>
              <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" /><span>Grados A · B · C certificados por peritaje.</span></li>
              <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" /><span>Venta final declarada antes de pagar.</span></li>
              <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" /><span>Pago protegido con Mercado Pago.</span></li>
            </ul>
            <p className="text-[11px] text-slate-400 pt-1">Compra protegida con cifrado SSL de 256 bits.</p>
          </div>

        </div>

        {/* Métodos de pago */}
        <div className="pt-6 border-t border-slate-100">
          <h5 className="font-bold text-slate-900 text-[11px] mb-2.5">Métodos de pago:</h5>
          <PaymentBadges />
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>© 2026 solooutlet. Todos los derechos reservados.</div>
          <div>Mercado oficial de liquidación y outlet para comercios verificados</div>
        </div>

      </div>
    </footer>
  );
};
