/**
 * Rutas de marketplace: OAuth Mercado Pago del vendedor + aprobación admin.
 * Montar en index.js con: app.use('/api', marketplaceRoutes);
 */
import { Router } from 'express';
import { pool } from '../dbPool.js';
import { mpAuthorizeUrl, exchangeAndStore, getTokenForSeller, disconnectSeller } from '../mpOAuth.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return required ? res.status(401).json({ error: 'No autenticado' }) : next();
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      return required ? res.status(401).json({ error: 'Sesión inválida' }) : next();
    }
  };
}

async function notify(email, type, title, body, metadata = {}) {
  if (!email) return;
  await pool.execute(
    'INSERT INTO notifications (id, user_email, type, title, body, metadata_json) VALUES (?, ?, ?, ?, ?, ?)',
    [`ntf-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, email.toLowerCase(), type, title, body, JSON.stringify(metadata)],
  );
}

const routes = Router();

// ── Vendedor: iniciar conexión OAuth con Mercado Pago ──
routes.get('/seller/mp/connect', auth(), async (req, res) => {
  if (req.user.role !== 'seller' || req.user.seller_status !== 'approved') {
    return res.status(403).json({ error: 'Solo vendedores aprobados pueden conectar Mercado Pago' });
  }
  res.redirect(mpAuthorizeUrl(req.user.id));
});

// ── Callback de MP: intercambia code por tokens (cifrados) ──
routes.get('/seller/mp/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.redirect(`${FRONT_URL}/?mp=error`);
  try {
    await exchangeAndStore(String(code), String(state));
    const [rows] = await pool.execute('SELECT email FROM users WHERE id = ?', [String(state)]);
    await notify(rows[0]?.email, 'system', '✅ Mercado Pago conectado',
      'Tu cuenta de Mercado Pago está vinculada a solooutlet. Las ventas te acreditan automáticamente el neto (menos comisión de la plataforma).');
    res.redirect(`${FRONT_URL}/?mp=conectado`);
  } catch {
    res.redirect(`${FRONT_URL}/?mp=error`);
  }
});

// ── Estado de conexión MP del vendedor ──
routes.get('/seller/mp/status', auth(), async (req, res) => {
  const [rows] = await pool.execute('SELECT mp_user_id, mp_connected_at FROM seller_profiles WHERE user_id = ?', [req.user.id]);
  const p = rows[0];
  res.json({ connected: !!(p?.mp_user_id), mpUserId: p?.mp_user_id || null, connectedAt: p?.mp_connected_at || null });
});

routes.post('/seller/mp/disconnect', auth(), async (req, res) => {
  await disconnectSeller(req.user.id);
  res.json({ ok: true });
});

// ── ADMIN: vendedores pendientes ──
routes.get('/admin/sellers', auth(), async (req, res) => {
  if (req.user.role !== 'admin' && !req.user.is_staff) return res.status(403).json({ error: 'Solo admin' });
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.full_name, u.seller_status, u.seller_rejected_reason,
            sp.store_name, sp.cuit, sp.business_name, sp.contact_person, sp.whatsapp, sp.category,
            sp.mp_user_id, sp.approved_at
     FROM users u LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.role = 'seller' OR sp.user_id IS NOT NULL
     ORDER BY u.seller_status = 'pending' DESC, sp.created_at DESC`,
  );
  res.json(rows);
});

routes.patch('/admin/sellers/:userId/review', auth(), async (req, res) => {
  if (req.user.role !== 'admin' && !req.user.is_staff) return res.status(403).json({ error: 'Solo admin' });
  const { approve, reason } = req.body || {};
  const status = approve ? 'approved' : 'rejected';
  await pool.execute(
    'UPDATE users SET seller_status = ?, seller_rejected_reason = ? WHERE id = ?',
    [status, approve ? null : reason || 'No cumple los requisitos', req.params.userId],
  );
  if (approve) {
    await pool.execute('UPDATE seller_profiles SET approved_by = ?, approved_at = NOW() WHERE user_id = ?', [req.user.id, req.params.userId]);
  }
  const [rows] = await pool.execute('SELECT email, full_name FROM users WHERE id = ?', [req.params.userId]);
  await notify(
    rows[0]?.email, 'system',
    approve ? '🎉 ¡Tu tienda fue aprobada!' : '❌ Solicitud de tienda rechazada',
    approve
      ? 'Ya podés conectar tu Mercado Pago y publicar tu stock en solooutlet.'
      : `Motivo: ${reason || 'No cumple los requisitos'}. Podés corregir tus datos y volver a postularte.`,
  );
  res.json({ ok: true, status });
});

export default routes;

