/**
 * Capa de datos SoloOutlet — lista para migrar a base de datos.
 * ------------------------------------------------------------------
 * HOY: persiste en localStorage (modo demo, sin backend).
 * MAÑANA (con DB): definí `VITE_API_URL` en el .env y esta misma
 * interfaz habla con tu API REST sin tocar el resto de la app:
 *
 *   GET    {API_URL}/products | orders | sellers | payouts | users
 *   POST   {API_URL}/products              → crear
 *   PATCH  {API_URL}/products/:id          → editar stock/precio
 *   DELETE {API_URL}/products/:id          → eliminar
 *   POST   {API_URL}/orders                → crear pedido (+settlement)
 *   PATCH  {API_URL}/orders/:id/status     → avanzar estado
 *   POST   {API_URL}/payouts               → generar liquidación
 *   PATCH  {API_URL}/payouts/:id/transfer  → marcar transferido
 *
 * El contexto (`StoreContext`) solo usa `load()` / `persist()` de
 * este archivo: el día de la migración se cambia UN archivo.
 */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
export const isApiMode = API_URL.length > 0;

/** Lee una colección (hoy: localStorage; mañana: GET). */
export function load<T>(key: string, fallback: T): T {
  if (isApiMode) {
    // En modo API el estado inicial viene del servidor vía `fetchCollection`.
    // Se devuelve el fallback hasta que la respuesta llega (ver `syncFromApi`).
    void syncFromApi(key, fallback);
    try {
      const cached = localStorage.getItem(`so_cache_${key}`);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      /* ignorar caché corrupta */
    }
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Guarda una colección (hoy: localStorage; mañana: PUT diferido + caché). */
export function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (isApiMode) localStorage.setItem(`so_cache_${key}`, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue en memoria */
  }
  if (isApiMode) {
    // Fire-and-forget: la API es la fuente de verdad, el caché es respaldo.
    void fetch(`${API_URL}/sync/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    }).catch(() => {});
  }
}

/** Borra una colección local (ej: logout). */
export function forget(key: string): void {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`so_cache_${key}`);
  } catch {
    /* ignorar */
  }
}

async function syncFromApi<T>(key: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}/sync/${key}`);
    if (!res.ok) return fallback;
    const data = (await res.json()) as T;
    localStorage.setItem(`so_cache_${key}`, JSON.stringify(data));
    return data;
  } catch {
    return fallback;
  }
}
