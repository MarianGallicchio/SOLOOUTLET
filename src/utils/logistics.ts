/**
 * Módulo de auto-logística (modo demo).
 * SOLOOUTLET es el anclaje: el vendedor despacha directo al comprador,
 * la plataforma genera la etiqueta, sigue el tracking y libera el pago al confirmarse la entrega.
 *
 * Cuando existan credenciales reales (Andreani/OCA/Correo Argentino),
 * generateShipmentLabel() y advanceTracking() son los únicos puntos a reemplazar
 * por llamadas a la API del courier — el resto del flujo no cambia.
 */
import { Order } from '../types';

export type ShipmentStatus =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered';

export interface ShipmentEvent {
  status: ShipmentStatus;
  label: string;
  date: string;
}

export interface Shipment {
  trackingNumber: string;
  courier: CourierId;
  courierName: string;
  status: ShipmentStatus;
  events: ShipmentEvent[];
  createdAt: string;
  etaDate: string;
  quotedPrice: number;
  /** Pesos y dimensiones declaradas por el vendedor al crear la etiqueta. */
  weightKg: number;
  dimensions: { alto: number; ancho: number; largo: number }; // cm
}

export type CourierId = 'andreani' | 'oca' | 'correo' | 'retiro';

export interface CourierInfo {
  id: CourierId;
  name: string;
  basePrice: number;
  pricePerKg: number;
  etaDays: number;
  /** Solo Courier Argentino: no llega a todo el país en el demo. */
  coverage: 'nacional' | 'retiro';
}

export const COURIERS: CourierInfo[] = [
  { id: 'andreani', name: 'Andreani', basePrice: 3490, pricePerKg: 890, etaDays: 3, coverage: 'nacional' },
  { id: 'oca', name: 'OCA', basePrice: 3190, pricePerKg: 950, etaDays: 4, coverage: 'nacional' },
  { id: 'correo', name: 'Correo Argentino', basePrice: 2790, pricePerKg: 750, etaDays: 5, coverage: 'nacional' },
  { id: 'retiro', name: 'Retiro en local del vendedor', basePrice: 0, pricePerKg: 0, etaDays: 1, coverage: 'retiro' },
];

export const SHIPMENT_STATUS_FLOW: ShipmentStatus[] = [
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  label_created: 'Etiqueta generada',
  picked_up: 'Retirado por el courier',
  in_transit: 'En camino al centro de distribución',
  out_for_delivery: 'En reparto — llega hoy',
  delivered: 'Entregado',
};

/** Peso demo por categoría (en la integración real lo declara el vendedor). */
export function estimateWeightKg(category: string): number {
  const cat = category.toLowerCase();
  if (cat.includes('hogar') || cat.includes('electro')) return 8;
  if (cat.includes('tecnolog') || cat.includes('audio') || cat.includes('gaming')) return 3;
  if (cat.includes('calzad')) return 1.5;
  return 1;
}

/** Cotización: precio base + peso. En demo, con zona simulada por ciudad. */
export function quoteShipment(courierId: CourierId, weightKg: number, city?: string): number {
  const c = COURIERS.find((x) => x.id === courierId);
  if (!c) return 0;
  if (c.coverage === 'retiro') return 0;
  const zoneFactor = city && /ushuaia|riogrande|río grande|calafate/i.test(city) ? 1.6 : 1;
  return Math.round((c.basePrice + Math.max(0, weightKg - 1) * c.pricePerKg) * zoneFactor);
}

export function makeTrackingNumber(courierId: CourierId): string {
  const prefixes: Record<CourierId, string> = {
    andreani: 'AND',
    oca: 'OCA',
    correo: 'CPA',
    retiro: 'LOC',
  };
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefixes[courierId]}-${rand}`;
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function formatShipmentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Crea el envío y devuelve la etiqueta (modo demo: número de tracking local).
 * PUNTO DE INTEGRACIÓN REAL: reemplazar por POST al API del courier
 * (p. ej. Andreani /v2/ordenes-de-retiro) y usar el tracking que devuelve.
 */
export function generateShipmentLabel(opts: {
  courierId: CourierId;
  weightKg: number;
  city?: string;
}): Shipment {
  const c = COURIERS.find((x) => x.id === opts.courierId)!;
  const now = new Date().toISOString();
  return {
    trackingNumber: makeTrackingNumber(opts.courierId),
    courier: c.id,
    courierName: c.name,
    status: 'label_created',
    events: [{ status: 'label_created', label: SHIPMENT_STATUS_LABEL.label_created, date: now }],
    createdAt: now,
    etaDate: addDaysISO(c.etaDays),
    quotedPrice: quoteShipment(opts.courierId, opts.weightKg, opts.city),
    weightKg: opts.weightKg,
    dimensions: { alto: 20, ancho: 25, largo: 30 },
  };
}

/**
 * Avanza el tracking un paso (modo demo: simulación local).
 * PUNTO DE INTEGRACIÓN REAL: reemplazar por GET de tracking del courier
 * o por webhook entrante → matcher de estados.
 */
export function advanceTracking(shipment: Shipment): Shipment {
  const idx = SHIPMENT_STATUS_FLOW.indexOf(shipment.status);
  if (idx < 0 || idx >= SHIPMENT_STATUS_FLOW.length - 1) return shipment;
  const next = SHIPMENT_STATUS_FLOW[idx + 1];
  return {
    ...shipment,
    status: next,
    events: [...shipment.events, { status: next, label: SHIPMENT_STATUS_LABEL[next], date: new Date().toISOString() }],
  };
}

/** Detección de SLA: horas máximas para despachar (etiqueta creada → retirado). */
export const PICKUP_SLA_HOURS = 48;

export function isPickupOverdue(order: Order): boolean {
  if (!order.shipment || order.shipment.status !== 'label_created') return false;
  const created = new Date(order.shipment.createdAt).getTime();
  return Date.now() - created > PICKUP_SLA_HOURS * 3600_000;
}

/** La liquidación al vendedor se libera solo con entrega confirmada. */
export function isPayoutUnlockedByDelivery(order: Order): boolean {
  return order.status === 'completado' && order.shipment?.status === 'delivered';
}
