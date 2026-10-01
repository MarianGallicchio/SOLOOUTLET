/**
 * Utilidades de cookies para solooutlet — consentimiento y persistencia e-commerce.
 *
 * NOTAS TÉCNICAS:
 * - Atributos: Path=/, SameSite=Lax, Secure cuando la página corre en HTTPS.
 * - HttpOnly NO se puede setear desde el front (requiere Set-Cookie del backend).
 *   El JWT de producción ya vive en localStorage; la cookie "Recordarme" guarda
 *   solo un identificador aleatorio (no sensible) para autocompletar el email.
 * - Límite ~4 KB por cookie: el carrito persiste SOLO IDs y cantidades,
 *   nunca objetos de producto completos.
 * - Consentimiento: cookie `cookie_consent` (12 meses) con las categorías
 *   aceptadas. Solo se escriben cookies de categorías aceptadas; al revocar,
 *   las de esa categoría se borran al instante.
 */

export type CookieCategory = 'necessary' | 'preferences' | 'analytics' | 'marketing';

export interface CookieConsent {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

export const CONSENT_COOKIE = 'cookie_consent';
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 12 meses

/** Catálogo legible de todas las cookies que la app puede crear (para "Mis cookies"). */
export const COOKIE_CATALOG: {
  name: string;
  category: CookieCategory;
  purpose: string;
  maxAgeDays: number;
}[] = [
  { name: 'cookie_consent', category: 'necessary', purpose: 'Guarda tu decisión de consentimiento de cookies.', maxAgeDays: 365 },
  { name: 'so_cart', category: 'necessary', purpose: 'Persiste tu carrito (IDs y cantidades) entre visitas.', maxAgeDays: 7 },
  { name: 'so_session_remember', category: 'preferences', purpose: 'Recordar tu email en este dispositivo ("Recordarme").', maxAgeDays: 30 },
  { name: 'so_recent', category: 'preferences', purpose: 'Últimos 10 productos que viste, para la sección "Vistos recientemente".', maxAgeDays: 30 },
  { name: 'so_prefs', category: 'preferences', purpose: 'Preferencias del catálogo: orden, filtros y categoría elegidos.', maxAgeDays: 365 },
  { name: 'so_coupon', category: 'preferences', purpose: 'Cupón promocional que aplicaste en el checkout.', maxAgeDays: 7 },
  { name: 'so_utm', category: 'analytics', purpose: 'Origen de tu visita (parámetros utm_) para medir campañas.', maxAgeDays: 30 },
  { name: 'so_offer_seen', category: 'marketing', purpose: 'Evita que el pop-up de oferta te vuelva a aparecer por 7 días.', maxAgeDays: 7 },
];

/* ── Primitivas ─────────────────────────────────────────────── */

export function cookiesEnabled(): boolean {
  try {
    return typeof navigator !== 'undefined' && navigator.cookieEnabled;
  } catch {
    return false;
  }
}

/** setCookie — atributos: Path=/, SameSite=Lax, Secure si HTTPS. maxAge en segundos. */
export function setCookie(name: string, value: string, maxAgeDays = 30): boolean {
  if (!cookiesEnabled()) return false;
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.round(maxAgeDays * 86400)}; SameSite=Lax${secure}`;
    return true;
  } catch {
    return false;
  }
}

export function getCookie(name: string): string | null {
  if (!cookiesEnabled()) return null;
  try {
    const target = encodeURIComponent(name) + '=';
    for (const part of document.cookie.split(';')) {
      const trimmed = part.trim();
      if (trimmed.startsWith(target)) {
        return decodeURIComponent(trimmed.slice(target.length));
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function deleteCookie(name: string): void {
  if (!cookiesEnabled()) return;
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  } catch { /* ignorar */ }
}

/** Lista de cookies de este sitio visibles para JS (solo nombre). */
export function getAllCookieNames(): string[] {
  if (!cookiesEnabled()) return [];
  try {
    return document.cookie.split(';')
      .map((c) => c.trim().split('=')[0])
      .filter(Boolean)
      .map((n) => { try { return decodeURIComponent(n); } catch { return n; } });
  } catch {
    return [];
  }
}

/* ── Consentimiento ─────────────────────────────────────────── */

export function getConsent(): CookieConsent | null {
  const raw = getCookie(CONSENT_COOKIE);
  if (!raw) {
    // Modo demo: auto-consentimiento mínimo para que el banner no tape la demo
    if (new URLSearchParams(window.location.search).has('demo')) {
      try {
        saveConsent({ preferences: true, analytics: false, marketing: false });
        return getConsent();
      } catch { /* seguir con banner */ }
    }
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (typeof parsed.preferences !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Guarda la decisión. Si una categoría se revoca, borra sus cookies al instante. */
export function saveConsent(consent: Omit<CookieConsent, 'decidedAt' | 'necessary'>): CookieConsent {
  const full: CookieConsent = { necessary: true, ...consent, decidedAt: new Date().toISOString() };
  setCookie(CONSENT_COOKIE, JSON.stringify(full), 365);
  // Revocación: borrar cookies de categorías ya no aceptadas
  for (const entry of COOKIE_CATALOG) {
    if (entry.category === 'necessary') continue;
    if (!full[entry.category as 'preferences' | 'analytics' | 'marketing']) {
      deleteCookie(entry.name);
    }
  }
  return full;
}

export function hasConsentFor(category: CookieCategory): boolean {
  if (category === 'necessary') return true;
  const c = getConsent();
  return !!c && !!c[category];
}

/** Escribe una cookie solo si la categoría fue aceptada. */
export function setConsentedCookie(name: string, value: string, category: Exclude<CookieCategory, 'necessary'>, maxAgeDays = 30): boolean {
  if (!hasConsentFor(category)) return false;
  return setCookie(name, value, maxAgeDays);
}

/* ── Helpers e-commerce (valores JSON compactos) ───────────── */

/** Carrito: SOLO ids y cantidades (límite 4 KB). */
export function saveCartCookie(items: { id: string; qty: number }[]): boolean {
  return setCookie('so_cart', JSON.stringify(items), 7);
}

export function getCartCookie(): { id: string; qty: number }[] {
  const raw = getCookie('so_cart');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.id === 'string' && typeof i.qty === 'number')
      .slice(0, 50)
      .map((i) => ({ id: String(i.id), qty: Math.max(1, Math.min(99, Math.round(i.qty))) }));
  } catch {
    return [];
  }
}

/** Vistos recientemente: últimos 10 IDs de producto. */
export function pushRecentlyViewed(productId: string, limit = 10): void {
  if (!hasConsentFor('preferences')) return;
  const raw = getCookie('so_recent');
  let list: string[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.map(String);
  } catch { /* arrancar de nuevo */ }
  const next = [productId, ...list.filter((id) => id !== productId)].slice(0, limit);
  setCookie('so_recent', JSON.stringify(next), 30);
}

export function getRecentlyViewed(): string[] {
  try {
    const parsed = JSON.parse(getCookie('so_recent') || '[]');
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 10) : [];
  } catch {
    return [];
  }
}

/** Origen de visita (utm_*) — categoría analíticas. */
export function captureUtm(): void {
  if (!hasConsentFor('analytics')) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const [k, v] of params.entries()) {
      if (k.startsWith('utm_') && v) utm[k] = v.slice(0, 120);
    }
    if (Object.keys(utm).length > 0) {
      setCookie('so_utm', JSON.stringify(utm), 30);
    }
  } catch { /* ignorar */ }
}

export function getUtm(): Record<string, string> {
  try {
    const parsed = JSON.parse(getCookie('so_utm') || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** "Recordarme": token aleatorio + email (no sensible, no HttpOnly). */
export function rememberUser(email: string): string {
  const token = (crypto?.randomUUID?.() || `tok-${Date.now()}-${Math.floor(Math.random() * 1e12)}`);
  setCookie('so_session_remember', JSON.stringify({ t: token, e: email.slice(0, 120) }), 30);
  return token;
}

export function getRememberedUser(): { token: string; email: string } | null {
  try {
    const parsed = JSON.parse(getCookie('so_session_remember') || 'null');
    return parsed?.t && parsed?.e ? { token: String(parsed.t), email: String(parsed.e) } : null;
  } catch {
    return null;
  }
}

export function forgetRememberedUser(): void {
  deleteCookie('so_session_remember');
}

/** Cupón aplicado (preferences). */
export function saveCoupon(code: string): void {
  setConsentedCookie('so_coupon', code.slice(0, 40), 'preferences', 7);
}
export function getCoupon(): string | null {
  return getCookie('so_coupon');
}
export function clearCoupon(): void {
  deleteCookie('so_coupon');
}

/** Pop-up de oferta: no reaparece por 7 días tras cerrarlo (marketing). */
export function markOfferDismissed(): void {
  setConsentedCookie('so_offer_seen', '1', 'marketing', 7);
}
export function offerWasDismissed(): boolean {
  return getCookie('so_offer_seen') === '1';
}

/** Preferencias del catálogo (orden/filtros). */
export function saveCatalogPrefs(prefs: Record<string, unknown>): void {
  setConsentedCookie('so_prefs', JSON.stringify(prefs).slice(0, 900), 'preferences', 365);
}
export function getCatalogPrefs(): Record<string, unknown> | null {
  try {
    const raw = getCookie('so_prefs');
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Borrar TODAS las cookies propias (no necesarias se borran; consent se reinicia). */
export function deleteAllOwnCookies(): void {
  for (const name of getAllCookieNames()) {
    if (COOKIE_CATALOG.some((c) => c.name === name)) {
      deleteCookie(name);
    }
  }
}

/** Export JSON con todas las cookies propias legibles (derecho de acceso). */
export function exportCookiesJson(): string {
  const consent = getConsent();
  const payload = {
    exportedAt: new Date().toISOString(),
    consent,
    cookies: COOKIE_CATALOG.map((c) => ({
      ...c,
      present: getAllCookieNames().includes(c.name),
      value: getCookie(c.name)?.slice(0, 200) ?? null,
    })),
    utm: getUtm(),
  };
  return JSON.stringify(payload, null, 2);
}
