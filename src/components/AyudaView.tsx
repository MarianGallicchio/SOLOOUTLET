import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, Truck, FileText, ArrowRight } from 'lucide-react';

type Section = 'garantia' | 'envios' | 'terminos';

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'garantia', label: 'Venta final y garantía', icon: <ShieldCheck className="w-4 h-4" /> },
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
            <h2 className="text-lg font-bold text-slate-900">Venta final · Garantía del fabricante</h2>
            <p>Todas las ventas son <strong>finales y sin devoluciones</strong>: lo que ves en las fotos reales es exactamente lo que recibís. Por eso el precio es de liquidación.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Garantía del fabricante</strong> por fallas de funcionamiento (no cosméticas):
                Grado A de 6 a 12 meses, Grado B 90 días, Grado C de 30 a 60 días.</li>
              <li><strong>Sin cambios ni arrepentimiento:</strong> revisá el reporte óptico y las fotos antes de pagar.</li>
              <li><strong>Disputas:</strong> solo por fraude o error grave en el envío, desde Mis Pedidos → Reportar problema grave.</li>
            </ul>
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
            <h2 className="text-lg font-bold text-slate-900">Términos y Condiciones del Servicio</h2>
            <p className="text-[11px] text-slate-400">Última actualización: septiembre 2026 · SoloOutlet S.A. (CUIT en trámite) · comercio@solooutlet.com.ar</p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">1. Naturaleza del servicio</h3>
            <p>SoloOutlet es un <strong>marketplace de liquidación</strong> que conecta comercios verificados con compradores finales. Los productos publicados corresponden a lotes de outlet: <strong>devoluciones comerciales, cajas abiertas, exhibición, stock con detalle estético o reacondicionado</strong>. Cada publicación declara su estado (Grado A, B o C) con fotos reales del lote y descripción del defecto, verificadas por nuestro equipo de auditoría.</p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">2. Venta final — SIN devoluciones ni cambios</h3>
            <p className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <strong>Todas las ventas son finales.</strong> Por la naturaleza de los productos de outlet, <strong>no se aceptan devoluciones, cambios ni cancelaciones por arrepentimiento, error de elección o diferencia estética ya declarada</strong>. Las fotos y la descripción del defecto publicadas constituyen la descripción completa del estado del producto: al pagar, el comprador declara haberlas revisado y las acepta. <strong>No existe derecho de retracto</strong> para estas ventas de liquidación.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Revisá antes de pagar:</strong> fotos reales del lote, reporte de peritaje y detalle del defecto en cada publicación.</li>
              <li><strong>Lo que ves es lo que recibís:</strong> el defecto declarado (rayón, falta de caja, detalle estético) NO es motivo de reclamo posterior.</li>
              <li><strong>Envío rechazado o no retirado:</strong> el pedido se reintegra al stock y se reembolsa el importe del producto (no los gastos de envío) menos los costos logísticos incurridos.</li>
            </ul>

            <h3 className="text-sm font-bold text-slate-900 pt-2">3. Garantía de funcionamiento</h3>
            <p>La garantía cubre <strong>fallas de funcionamiento</strong>, nunca detalles estéticos ya declarados. El plazo corresponde al publicado en cada producto:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Grado A</strong> (Como Nuevo): 6 a 12 meses de garantía del fabricante.</li>
              <li><strong>Grado B</strong> (Detalle Estético Leve): 90 días.</li>
              <li><strong>Grado C</strong> (Reacondicionado): 30 a 60 días.</li>
              <li><strong>Lotes B2B</strong>: según manifiesto de carga acordado.</li>
            </ul>
            <p>La garantía la hace efectiva el comercio vendedor; SoloOutlet media en caso de demora o desacuerdo.</p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">4. Disputas — únicos casos admitidos</h3>
            <p>Al ser ventas finales, solo se admite disputa dentro de los <strong>7 días de recibida la entrega</strong> por: (a) <strong>no recepción</strong> del pedido despachado, (b) <strong>error grave</strong>: producto sustancialmente distinto al publicado o falla funcional no declarada, o (c) <strong>presunto fraude</strong>. Corresponden canales: Mis Pedidos → Reportar problema grave. Las disputas procedentes pueden derivar en reembolso total o parcial a criterio de SoloOutlet.</p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">5. Comisiones y pagos a vendedores</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Comisión escalonada sobre cada venta</strong>: 15% hasta $50.000; 12% entre $50.001 y $200.000; 10% por encima de $200.000. Se retiene automáticamente al confirmarse la venta vía <strong>split de pagos de Mercado Pago</strong>: el dinero se reparte en el momento del pago, sin transferencias manuales.</li>
              <li><strong>Orden de descuentos al vendedor:</strong> del monto total de la venta se descuenta primero la <strong>comisión de Mercado Pago</strong> (por procesamiento del pago) y luego la <strong>comisión de SoloOutlet</strong>. Es decir, el vendedor recibe el total − comisión MP − comisión SoloOutlet. El vendedor declara conocer y aceptar este orden al conectar su cuenta de Mercado Pago.</li>
              <li><strong>Reembolsos:</strong> en caso de reembolso de una venta, el importe se descuenta <strong>proporcionalmente</strong> de la cuenta de Mercado Pago del vendedor y de la de SoloOutlet. Si el saldo del vendedor no alcanza para cubrir su parte, SoloOutlet cubre su porción y el remanente se recupera por los medios legales correspondientes o se compensa con liquidaciones futuras del vendedor.</li>
              <li><strong>Liquidación al vendedor:</strong> el neto (bruto − comisión − costo de pasarela) queda pendiente con un <strong>encaje de 2 días</strong> de clearing y se transfiere al CBU/alias/Mercado Pago registrado del vendedor al generarse la liquidación desde su panel (o automáticamente por la plataforma).</li>
              <li><strong>Reintegros por disputa resuelta a favor del comprador</strong> se descuentan de la próxima liquidación del vendedor.</li>
            </ul>

            <h3 className="text-sm font-bold text-slate-900 pt-2">6. Obligaciones de los vendedores</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Transparencia obligatoria:</strong> toda publicación debe declarar el estado real del producto con fotos del defecto. Publicaciones engañosas se dan de baja y pueden suspender la tienda.</li>
              <li><strong>Despacho en 24 hs hábiles.</strong> Tres incumplimientos suspenden la cuenta.</li>
              <li><strong>Stock real:</strong> sin unidades fantasma. La venta reserva el stock al instante.</li>
              <li><strong>Responsabilidad fiscal:</strong> facturación conforme a su condición tributaria (Factura A disponible para B2B).</li>
            </ul>

            <h3 className="text-sm font-bold text-slate-900 pt-2">7. Cuentas y seguridad</h3>
            <p>Las cuentas de comprador y vendedor son <strong>separadas</strong> por email. Cada usuario es responsable de la confidencialidad de su contraseña. SoloOutlet puede suspender cuentas ante fraude, abuso del sistema de disputas o reventa de productos con descripción falseada.</p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">8. Protección de datos y medio de pago</h3>
            <p>Los pagos se procesan con <strong>Mercado Pago</strong> y pasarelas con cifrado SSL de 256 bits; SoloOutlet no almacena datos de tarjetas. Los datos personales se tratan conforme a la Ley 25.326 de Protección de Datos Personales (Argentina); podés solicitar acceso, rectificación o baja de tus datos por el canal de ayuda.</p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">9. Aceptación</h3>
            <p>El uso de la plataforma, el registro de una cuenta o la confirmación de una compra implican la <strong>aceptación plena de estos términos</strong>. SoloOutlet puede actualizarlos; los cambios rigen desde su publicación y las ventas ya concretadas se rigen por la versión vigente al momento de la compra.</p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setCurrentView('vender')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer"
              >
                Quiero vender <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setHelpSection('garantia')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Ver resumen de venta final y garantía
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
