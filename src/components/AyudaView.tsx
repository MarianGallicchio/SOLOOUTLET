import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Truck, FileText, ArrowRight } from 'lucide-react';

type Section = 'garantia' | 'envios' | 'terminos';

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'garantia', label: 'Garantía y devoluciones', icon: <ShieldCheck className="w-4 h-4" /> },
  { key: 'envios', label: 'Seguimiento de envíos', icon: <Truck className="w-4 h-4" /> },
  { key: 'terminos', label: 'Términos para comercios', icon: <FileText className="w-4 h-4" /> },
];

/** Centro de ayuda: lo que el footer promete, con contenido real. */
export const AyudaView: React.FC = () => {
  const { helpSection, setHelpSection, setCurrentView, currentUser } = useStore();
  const active: Section = helpSection ?? 'garantia';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [active]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Ayuda y garantías</h1>
      <p className="text-sm text-slate-500 mt-1">Todo lo que necesitás saber para comprar y vender con confianza.</p>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mt-6 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setHelpSection(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer ${
              active === s.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mt-4 text-sm text-slate-700 leading-relaxed space-y-4">
        {active === 'garantia' && (
          <>
            <h2 className="text-lg font-bold text-slate-900">Garantía y devoluciones</h2>
            <p>Cada producto publica su garantía en días (30 a 180 según el estado). Si lo que recibís no coincide con el estado declarado, tenés <strong>10 días de prueba</strong> para cambio o devolución total.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Grado A:</strong> 6 a 12 meses de garantía.</li>
              <li><strong>Grado B:</strong> 90 días de garantía.</li>
              <li><strong>Grado C:</strong> 30 a 60 días de garantía.</li>
            </ul>
            <p>El dinero se acredita al mismo medio de pago en un plazo máximo de 10 días hábiles.</p>
          </>
        )}
        {active === 'envios' && (
          <>
            <h2 className="text-lg font-bold text-slate-900">Seguimiento de envíos</h2>
            <p>Despachamos en 24 hs hábiles por Andreani Express a todo el país, con paquete asegurado por el valor total.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>CABA y GBA: 24 a 48 hs.</li>
              <li>Resto del país: 48 a 96 hs.</li>
              <li>Cada pedido tiene su guía <span className="font-mono font-bold">AND-XXXX-AR</span>.</li>
            </ul>
            <button
              onClick={() => (currentUser ? setCurrentView('profile') : setCurrentView('catalog'))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#004AC6] text-white text-xs font-bold hover:bg-[#1D4ED8] cursor-pointer"
            >
              {currentUser ? 'Ver mis pedidos' : 'Explorar catálogo'} <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
        {active === 'terminos' && (
          <>
            <h2 className="text-lg font-bold text-slate-900">Términos de servicio para comercios</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Comisión:</strong> SoloOutlet retiene automáticamente el 8% de cada venta (mínimo $100) más el costo de pasarela. El neto se transfiere a tu CBU/alias.</li>
              <li><strong>Transparencia obligatoria:</strong> toda publicación debe declarar el estado real con fotos del defecto. Publicaciones engañosas se dan de baja.</li>
              <li><strong>Despacho:</strong> 24 hs hábiles desde la venta. Tres incumplimientos suspenden la tienda.</li>
              <li><strong>Garantía:</strong> el comercio responde por la garantía publicada; SoloOutlet media en disputas.</li>
              <li><strong>Liquidaciones:</strong> el neto queda pendiente al vender y se libera a tu cuenta al solicitar la transferencia desde tu panel.</li>
            </ul>
            <button
              onClick={() => setCurrentView('vender')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer"
            >
              Quiero vender <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
