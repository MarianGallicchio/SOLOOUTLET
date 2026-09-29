import { Product } from '../types';

/**
 * Motor de recomendaciones "También te puede interesar".
 * Scoring ponderado según lo que el comprador está viendo:
 *  - Misma categoría: +30
 *  - Tags en común:   +12 por tag (máx 36)
 *  - Mismo vendedor:  +10 (confianza en la tienda)
 *  - Rango de precio similar (±60%): +15
 *  - Ahorro similar (±15pts de descuento): +8
 *  - Misma condición (estado): +6
 *  - Populares (rating/reseñas) y con stock: leve boost, y sin stock baja puntero.
 * Si el catálogo está vacío o no hay coincidencias, devuelve los mejores
 * fallback (destacados con más descuento) para que la sección nunca quede vacía.
 */
export function getRecommendations(
  product: Product,
  catalog: Product[],
  opts: { limit?: number } = {},
): { items: Product[]; reason: string } {
  const limit = opts.limit ?? 4;
  const candidates = catalog.filter((p) => p.id !== product.id);

  if (candidates.length === 0) return { items: [], reason: '' };

  const scored = candidates.map((p) => {
    let score = 0;
    const reasons: string[] = [];

    if (p.cat === product.cat) {
      score += 30;
      reasons.push(`en ${p.cat}`);
    }
    const sharedTags = (p.tags || []).filter((t) => (product.tags || []).includes(t));
    if (sharedTags.length > 0) {
      score += Math.min(36, sharedTags.length * 12);
      reasons.push(`relacionado con ${sharedTags[0].toLowerCase()}`);
    }
    if (p.vendor === product.vendor) {
      score += 10;
      reasons.push('mismo vendedor de confianza');
    }
    if (product.price > 0 && Math.abs(p.price - product.price) / product.price <= 0.6) {
      score += 15;
      reasons.push('precio similar');
    }
    if (Math.abs(p.discount - product.discount) <= 15) {
      score += 8;
      reasons.push('ahorro parecido');
    }
    if (p.estado === product.estado) {
      score += 6;
    }
    // Popularity & availability
    score += (p.rating || 4.5) * 2;
    score += Math.min(6, (p.reviewCount || 0));
    if (p.stock > 0) score += 5;
    else score -= 25;

    return { product: p, score, reason: reasons[0] || 'recomendado para vos' };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  // Fallback: si el top quedó con todo sin stock o sin nada relevante, completar con destacados.
  const items = top.map((t) => t.product);
  if (items.length < limit) {
    const fill = catalog
      .filter((p) => p.id !== product.id && !items.some((i) => i.id === p.id) && p.stock > 0)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, limit - items.length);
    items.push(...fill);
  }

  return { items, reason: top[0]?.reason || '' };
}
