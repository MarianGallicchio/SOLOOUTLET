/**
 * OAuth de Mercado Pago para vendedores (marketplace split)
 * ---------------------------------------------------------
 * Flujo:
 *   1. GET  /api/seller/mp/connect    → redirige al consentimiento de MP
 *   2. MP vuelve a GET /api/seller/mp/callback?code=...&state=<userId>
 *   3. Intercambiamos code → access_token + refresh_token + user_id
 *   4. Tokens CIFRADOS con AES-256-GCM (clave = MP_OAUTH_SECRET del .env)
 *      y guardados en seller_profiles. El access token expira en 6 h:
 *      getTokenForSeller() lo renueva automáticamente con el refresh token.
 *
 * .env:
 *   MP_CLIENT_ID / MP_CLIENT_SECRET  → app "Marketplace" en MP Developers
 *   MP_REDIRECT_URI                  → https://tudominio/api/seller/mp/callback
 *   MP_OAUTH_SECRET                  → clave larga para cifrar tokens (32+ chars)
 */

import crypto from 'crypto';
import { pool } from './dbPool.js';

const MP_OAUTH_URL = 'https://auth.mercadopago.com/authorization';
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

const clientId = process.env.MP_CLIENT_ID || '';
const clientSecret = process.env.MP_CLIENT_SECRET || '';
const redirectUri = process.env.MP_REDIRECT_URI || '';

// ── Cifrado AES-256-GCM ──
const key = crypto.createHash('sha256').update(process.env.MP_OAUTH_SECRET || 'dev-insecure-secret').digest();

export function encrypt(plain) {
  if (!plain) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]);
}

export function decrypt(blob) {
  if (!blob) return null;
  const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** URL de consentimiento de MP (vendedor autoriza a la plataforma). */
export function mpAuthorizeUrl(userId) {
  return (
    `${MP_OAUTH_URL}?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(userId)}` +
    `&scope=offline_access`
  );
}

/** Intercambia el code por tokens y los guarda cifrados. */
export async function exchangeAndStore(code, userId) {
  const res = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'MP rechazó el intercambio de tokens');

  const expiresAt = new Date(Date.now() + (data.expires_in || 21600) * 1000);
  await pool.execute(
    `UPDATE seller_profiles
     SET mp_user_id = ?, mp_access_token = ?, mp_refresh_token = ?, mp_token_expires_at = ?, mp_connected_at = NOW()
     WHERE user_id = ?`,
    [String(data.user_id), encrypt(data.access_token), encrypt(data.refresh_token), expiresAt, userId],
  );
  return { mpUserId: String(data.user_id) };
}

/** Devuelve un access token VIGENTE del vendedor (renueva si expiró). */
export async function getTokenForSeller(userId) {
  const [rows] = await pool.execute('SELECT mp_access_token, mp_refresh_token, mp_token_expires_at FROM seller_profiles WHERE user_id = ?', [userId]);
  const p = rows[0];
  if (!p?.mp_access_token) return null;
  const token = decrypt(p.mp_access_token);
  const stillValid = p.mp_token_expires_at && new Date(p.mp_token_expires_at).getTime() - Date.now() > 60_000;
  if (stillValid) return token;

  // Renovación con refresh token
  const refresh = decrypt(p.mp_refresh_token);
  if (!refresh) return token; // sin refresh: usar el actual hasta que falle
  const res = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refresh,
    }),
  });
  const data = await res.json();
  if (!res.ok) return token;
  const expiresAt = new Date(Date.now() + (data.expires_in || 21600) * 1000);
  await pool.execute(
    'UPDATE seller_profiles SET mp_access_token = ?, mp_refresh_token = ?, mp_token_expires_at = ? WHERE user_id = ?',
    [encrypt(data.access_token), encrypt(data.refresh_token), expiresAt, userId],
  );
  return data.access_token;
}

/** Desconecta la cuenta MP del vendedor. */
export async function disconnectSeller(userId) {
  await pool.execute(
    'UPDATE seller_profiles SET mp_access_token = NULL, mp_refresh_token = NULL, mp_user_id = NULL, mp_token_expires_at = NULL, mp_connected_at = NULL WHERE user_id = ?',
    [userId],
  );
}
