/**
 * Motor central de comisiones y liquidaciones — SoloOutlet
 * ------------------------------------------------------------------
 * Toda la plataforma usa ESTE archivo como única fuente de verdad.
 * - SoloOutlet retiene automáticamente la comisión en cada venta.
 * - El vendedor recibe el neto (bruto - comisión - costo pasarela).
 * - Los payouts se generan automáticamente y quedan pendientes hasta
 *   que el admin los marca como transferidos.
 *
 * Integración futura Mercado Pago:
 * - Reemplazar `simulateTransfer()` por la API de transferencias MP
 *   (OAuth vendedor + `POST /v1/payments` con `application_fee`).
 * - El campo `settlement.platformFee` mapea directo a `application_fee`.
 */

export const COMMISSION_CONFIG = {
  /** % que retiene SoloOutlet por cada venta (0.08 = 8%) */
  rate: 0.08,
  /** Mínimo retenido por operación (evita micro-comisiones de $0) */
  minFee: 100,
  /** Días de encaje / clearing antes de liberar el pago al vendedor */
  clearingDays: 2,
  /** Alias/CBU de la cuenta recaudadora de SoloOutlet S.A. */
  platformAlias: 'SOLOOUTLET.OFICIAL',
  platformCbu: '0000003100012345678901',
} as const;

/** Cupones vigentes (código → % off sobre subtotal). A futuro: tabla `coupons` en DB. */
export const COUPONS: Record<string, { rate: number; minSubtotal: number; label: string }> = {
  OUTLET10: { rate: 0.1, minSubtotal: 50000, label: '10% OFF en tu compra' },
  BIENVENIDA15: { rate: 0.15, minSubtotal: 100000, label: '15% OFF bienvenida' },
};

export function resolveCoupon(code: string, subtotal: number): { code: string; amount: number; label: string } | null {
  const c = COUPONS[code.trim().toUpperCase()];
  if (!c || subtotal < c.minSubtotal) return null;
  return { code: code.trim().toUpperCase(), amount: Math.round(subtotal * c.rate), label: c.label };
}

/** Opciones de envío. A futuro: cotizador Andreani por CP. */
export const SHIPPING_OPTIONS = {
  standard: { label: 'Estándar (48-96 hs)', freeOver: 150000, cost: 7500, eta: 'Llega en 2 a 4 días hábiles' },
  express: { label: 'Expreso (24 hs)', freeOver: 300000, cost: 12900, eta: 'Llega mañana antes de las 18 hs' },
} as const;

export function resolveShipping(option: 'standard' | 'express', subtotal: number): number {
  const o = SHIPPING_OPTIONS[option] ?? SHIPPING_OPTIONS.standard;
  return subtotal > o.freeOver ? 0 : o.cost;
}

/** Costo estimado de pasarela por método (lo absorbe el vendedor, se descuenta del neto). */
export const GATEWAY_COST: Record<string, number> = {
  mercadopago: 0.0599, // 5.99% + IVA aprox MP Argentina (referencia)
  credit_card: 0.049,
  debit_card: 0.029,
  transfer: 0,
};

export interface OrderSettlement {
  /** Bruto cobrado al comprador (subtotal - descuentos + envío). */
  gross: number;
  /** Comisión SoloOutlet retenida automáticamente. */
  platformFee: number;
  /** Costo de pasarela descontado del neto vendedor. */
  gatewayFee: number;
  /** Neto a transferir al vendedor. */
  netPayout: number;
  /** Tasa aplicada (auditoría). */
  rateApplied: number;
}

export function calcSettlement(
  gross: number,
  method: string,
  rate = COMMISSION_CONFIG.rate,
): OrderSettlement {
  const safeGross = Math.max(0, Math.round(gross));
  const rawFee = Math.round(safeGross * rate);
  const platformFee = safeGross > 0 ? Math.max(rawFee, COMMISSION_CONFIG.minFee) : 0;
  const gatewayRate = GATEWAY_COST[method] ?? 0;
  const gatewayFee = Math.round(safeGross * gatewayRate);
  const netPayout = Math.max(0, safeGross - platformFee - gatewayFee);
  return { gross: safeGross, platformFee, gatewayFee, netPayout, rateApplied: rate };
}

/** Fecha de liberación = fecha venta + clearingDays. */
export function releaseDateFrom(dateISO: string, clearingDays = COMMISSION_CONFIG.clearingDays): string {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setDate(d.getDate() + clearingDays);
  return d.toISOString();
}

export function formatReleaseDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}
