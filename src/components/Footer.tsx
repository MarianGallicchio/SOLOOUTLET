import React from 'react';
import { useStore } from '../context/StoreContext';
import { isMerchant, isPlatformOwner } from '../utils/sellerWorkspace';
import { Package } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, setHelpSection, currentUser, openAuthModal } = useStore();
  const seller = isMerchant(currentUser);

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

  const linkCls = 'hover:text-[#004AC6] transition-colors cursor-pointer text-left';

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Col 1: Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#004AC6] flex items-center justify-center text-white">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 font-display">
                solo<span className="text-[#004AC6]">outlet</span>
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              El marketplace donde el stock de devoluciones, productos sin caja o con detalles de fábrica encuentra compradores que buscan precios de liquidación garantizados.
            </p>
          </div>

          {/* Col 2: Compradores */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Compradores
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => setCurrentView('catalog')} className={linkCls}>
                  Explorar Catálogo
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('catalog')} className={linkCls}>
                  Últimas oportunidades
                </button>
              </li>
              <li>
                <button onClick={() => goHelp('garantia')} className={linkCls}>
                  Garantía y devoluciones de 90 días
                </button>
              </li>
              <li>
                <button onClick={() => goHelp('envios')} className={linkCls}>
                  Seguimiento de envíos
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Comercios */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Comercios
            </h5>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={goPublish}
                  className={`${linkCls} font-semibold text-[#004AC6]`}
                >
                  Publicar producto (Asistente 4 pasos)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('vender')} className={linkCls}>
                  Vender stock y devoluciones
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('vender')} className={linkCls}>
                  Simulador de comisiones
                </button>
              </li>
              <li>
                <button
                  onClick={goAdminPanel}
                  className={`${linkCls} font-semibold text-[#004AC6]`}
                >
                  Panel de administración y ventas
                </button>
              </li>
              <li>
                <button onClick={() => goHelp('terminos')} className={linkCls}>
                  Términos de servicio para comercios
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Medios de Pago */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Medios de Pago Integrados
            </h5>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-bold text-[10px] text-slate-700">
                Mercado Pago
              </span>
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-bold text-[10px] text-slate-700">
                Visa
              </span>
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-bold text-[10px] text-slate-700">
                Mastercard
              </span>
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-bold text-[10px] text-slate-700">
                Amex
              </span>
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-bold text-[10px] text-slate-700">
                DEBIN / CBU
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-2">
              Cobros protegidos con cifrado SSL de 256 bits y liquidación automática.
            </p>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © 2026 solooutlet. Todos los derechos reservados.
          </div>
          <div>
            Mercado oficial de liquidación y outlet para comercios verificados
          </div>
        </div>

      </div>
    </footer>
  );
};
