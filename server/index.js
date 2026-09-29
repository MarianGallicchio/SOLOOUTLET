/**
 * solooutlet — API backend (Express + MySQL + Mercado Pago)
 * ------------------------------------------------------------------
 * Arranque:
 *   1. mysql -u root -p < server/schema.sql     (crea la DB unificada)
 *   2. cp .env.example .env                     (completar credenciales)
 *   3. npm run server                           (puerto 3001)
 *
 * Frontend: definir VITE_API_URL=http://localhost:3001 en el .env del proyecto.
 *
 * Mercado Pago (producción real):
 *   - MP_ACCESS_TOKEN en .env (APP_USR-... para producción, TEST-... para pruebas).
 *   - POST /api/checkout crea la preferencia y devuelve init_point (URL de pago MP).
 *   - MP llama a POST /api/webhooks/mercadopago; verificamos el pago contra la API
 *     de MP y acreditamos la orden + retención de comisión + notificación al vendedor.
 *   - Configurar en el panel de MP la URL pública del webhook
 *     (ej: https://tudominio.com/api/webhooks/mercadopago).
 *
 * Comisión escalonada (misma fuente que el frontend):
 *   15% hasta $50.000 · 12% hasta $200.000 · 10% por encima.
 *   La retención se aplica sobre el bruto de la orden; el neto va al vendedor.
 */

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import 'dotenv/config';

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5173';

// ── MySQL ──
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'solooutlet',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

// ── Mercado Pago (si hay token) ──
const mpClient = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  : null;
const mpPreference = mpClient ? new Preference(mpClient) : null;
const mpPayment = mpClient ? new Payment(mpClient) : null;

const app = express();
app.use(cors({ origin: FRONT_URL.split(',').map((s) => s.trim()) }));
// Webhook de MP necesita el body crudo para validar; el resto usa JSON.
app.use('/api/webhooks/mercadopago', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '2mb' }));

// ── Utilidades ──
const j = (v, fb) => (v == null ? fb : typeof v === 'string' ? JSON.parse(v) : v);
const rateFor = (gross) => (gross <= 50000 ? 0.15 : gross <= 200000 ? 0.12 : 0.1);
const calcSettlement = (gross, method, rate) => {
  const safeGross = Math.max(0, Math.round(gross));
  const eff = rate ?? rateFor(safeGross);
  const GATEWAY = { mercadopago: 0.0599, credit_card: 0.049, debit_card: 0.029, transfer: 0 };
  const platformFee = safeGross > 0 ? Math.max(Math.round(safeGross * eff), 100) : 0;
  const gatewayFee = Math.round(safeGross * (GATEWAY[method] ?? 0));
  return { gross: safeGross, platformFee, gatewayFee, netPayout: Math.max(0, safeGross - platformFee - gatewayFee), rateApplied: eff };
};
const clearDays = 2;
const releaseDate = () => new Date(Date.now() + clearDays * 864e5).toISOString();

/** Notificación para un usuario (por email). */
async function notify(email, type, title, body, metadata = {}) {
  if (!email) return;
  await pool.execute(
    'INSERT INTO notifications (id, user_email, type, title, body, metadata_json) VALUES (?, ?, ?, ?, ?, ?)',
    [`ntf-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, email.toLowerCase(), type, title, body, JSON.stringify(metadata)],
  );
}

/** Auth middleware: Bearer token JWT → req.user {id, email, role, store_name, is_staff}. */
function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: 'No autenticado' });
      return next();
    }
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      if (required) return res.status(401).json({ error: 'Sesión inválida o vencida' });
      next();
    }
  };
}

const orderRowToApi = (row) => ({
  id: row.id,
  orderNumber: row.order_number,
  date: row.created_at,
  customer: j(row.customer_json, {}),
  items: j(row.items_json, []),
  subtotal: row.subtotal,
  discountAmount: row.discount_amount,
  shipping: row.shipping,
  total: row.total,
  paymentDetails: j(row.payment_json, {}),
  status: row.status,
  settlement: j(row.settlement_json, null),
  sellerName: row.seller_store,
  payoutStatus: row.payout_status,
  payoutReleaseAt: row.payout_release_at,
  dispute: j(row.dispute_json, null),
  mpPaymentId: row.mp_payment_id,
});

// ══════════════════ AUTH ══════════════════
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password, role, storeName } = req.body || {};
  if (!email || !password || !fullName) return res.status(400).json({ error: 'Faltan datos' });
  const emailNorm = String(email).trim().toLowerCase();
  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [emailNorm]);
    if (existing.length) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    const id = `usr-${Date.now()}`;
    const hash = await bcrypt.hash(String(password), 10);
    const isStaff = ['admin@solooutlet.com', 'marianoagusting1996@gmail.com'].includes(emailNorm);
    await pool.execute(
      'INSERT INTO users (id, full_name, email, password_hash, role, store_name, is_staff) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, fullName.trim(), emailNorm, hash, role === 'merchant_approved' ? 'merchant_approved' : 'buyer', storeName || null, isStaff],
    );
    if (role === 'merchant_approved' && storeName) {
      await pool.execute('INSERT IGNORE INTO sellers (id, store_name, owner_email) VALUES (?, ?, ?)', [`sel-${Date.now()}`, storeName, emailNorm]);
    }
    const token = jwt.sign({ id, email: emailNorm, role: role || 'buyer', store_name: storeName || null, is_staff: isStaff }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, fullName, email: emailNorm, role: role || 'buyer', storeName: storeName || null } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = String(email || '').trim().toLowerCase();
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [emailNorm]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(String(password || ''), u.password_hash))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    const token = jwt.sign({ id: u.id, email: u.email, role: u.role, store_name: u.store_name, is_staff: !!u.is_staff }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, fullName: u.full_name, email: u.email, role: u.role, storeName: u.store_name, phone: u.phone, address: u.address, city: u.city, postalCode: u.postal_code } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Login con Google: recibe el ID token (credential) de Google Identity Services,
 * lo verifica contra la API de Google, crea/actualiza el usuario en MySQL y emite JWT.
 * Requiere GOOGLE_CLIENT_ID configurado en .env para validar la audiencia.
 */
async function verifyGoogleCredential(credential) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!res.ok) throw new Error('Token de Google inválido');
  const info = await res.json();
  if (info.email_verified !== 'true' && info.email_verified !== true) throw new Error('Email de Google no verificado');
  if (process.env.GOOGLE_CLIENT_ID && info.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Token de Google de otra aplicación');
  }
  if (!info.exp || Number(info.exp) * 1000 < Date.now()) throw new Error('Token de Google expirado');
  return { email: String(info.email).toLowerCase(), name: info.name || info.email.split('@')[0], picture: info.picture || null };
}

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Falta el credential de Google' });
  try {
    const g = await verifyGoogleCredential(credential);
    let [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [g.email]);
    let u = rows[0];
    if (!u) {
      // Registro automático por Google (cuenta compradora)
      const id = `usr-${Date.now()}`;
      const hash = await bcrypt.hash(`google:${credential.slice(-24)}`, 10);
      const isStaff = ['admin@solooutlet.com', 'marianoagusting1996@gmail.com'].includes(g.email);
      await pool.execute(
        'INSERT INTO users (id, full_name, email, password_hash, role, is_staff) VALUES (?, ?, ?, ?, ?, ?)',
        [id, g.name, g.email, hash, 'buyer', isStaff],
      );
      u = { id, full_name: g.name, email: g.email, role: 'buyer', store_name: null, is_staff: isStaff };
    }
    const token = jwt.sign({ id: u.id, email: u.email, role: u.role, store_name: u.store_name, is_staff: !!u.is_staff }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, fullName: u.full_name, email: u.email, role: u.role, storeName: u.store_name } });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

app.get('/api/auth/me', auth(), async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const u = rows[0];
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ id: u.id, fullName: u.full_name, email: u.email, role: u.role, storeName: u.store_name, phone: u.phone, address: u.address, city: u.city, postalCode: u.postal_code });
});

// ══════════════════ PRODUCTOS ══════════════════
app.get('/api/products', async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
  res.json(rows.map((r) => ({
    id: r.id, title: r.title, vendor: r.vendor, estado: r.estado, cat: r.cat,
    price: r.price, originalPrice: r.original_price, discount: r.discount,
    image: r.image, stock: r.stock, conditionDetails: r.condition_details,
    description: r.description, warrantyDays: r.warranty_days, sku: r.sku,
    specs: r.specs ? r.specs.split('|').map((s) => s.trim()) : [],
    createdAt: r.created_at,
  })));
});

app.post('/api/products', auth(), async (req, res) => {
  const p = req.body || {};
  const store = req.user.store_name || p.vendor || 'Tienda';
  const id = `prod-${Date.now()}`;
  const sku = `OUT-${String(p.cat || 'GEN').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  await pool.execute(
    `INSERT INTO products (id, seller_store, title, vendor, estado, cat, price, original_price, discount, image, stock, condition_details, description, warranty_days, specs, sku)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, store, p.title, store, p.estado, p.cat, p.price, p.originalPrice || p.price,
      p.discount || Math.max(0, Math.round((1 - p.price / (p.originalPrice || p.price)) * 100)),
      p.image || null, p.stock || 1, p.conditionDetails || null, p.description || null,
      p.warrantyDays || 30, Array.isArray(p.specs) ? p.specs.join('|') : p.specs || null, sku],
  );
  res.json({ id });
});

app.delete('/api/products/:id', auth(), async (req, res) => {
  await pool.execute('DELETE FROM products WHERE id = ? AND seller_store = ?', [req.params.id, req.user.store_name || '']);
  res.json({ ok: true });
});

// ══════════════════ CHECKOUT + MERCADO PAGO ══════════════════
app.post('/api/checkout', auth(), async (req, res) => {
  const { customer, items, shippingOption = 'standard', couponCode } = req.body || {};
  if (!items?.length) return res.status(400).json({ error: 'Carrito vacío' });
  try {
    const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const shipping = subtotal > 150000 ? 0 : 7500;
    const total = subtotal + shipping;

    const id = `ord-${Date.now()}`;
    const orderNumber = `SO-${Math.floor(1000 + Math.random() * 9000)}`;
    const sellerStore = items[0].product.vendor || 'ElectroPlaza Outlet';

    await pool.execute(
      `INSERT INTO orders (id, order_number, buyer_email, customer_json, items_json, subtotal, discount_amount, shipping, total, payment_method, status, mp_preference_id, settlement_json, seller_store, payout_status, payout_release_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'mercadopago', 'pendiente_pago', ?, ?, ?, 'pendiente', ?)`,
      [id, orderNumber, req.user.email, JSON.stringify(customer), JSON.stringify(items),
        subtotal, shipping, total, null, JSON.stringify(calcSettlement(total, 'mercadopago')), sellerStore, releaseDate()],
    );

    // Reservar stock
    for (const it of items) {
      await pool.execute('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [it.quantity, it.product.id]);
    }

    // Preferencia Mercado Pago (pago real)
    if (mpPreference) {
      const pref = await mpPreference.create({
        body: {
          items: items.map((i) => ({
            title: i.product.title.slice(0, 250),
            quantity: i.quantity,
            currency_id: 'ARS',
            unit_price: i.product.price,
          })),
          payer: { email: req.user.email, name: customer?.fullName },
          shipments: { cost: shipping, mode: 'not_specified' },
          external_reference: id,
          back_urls: {
            success: `${FRONT_URL}/?pago=aprobado&orden=${orderNumber}`,
            pending: `${FRONT_URL}/?pago=pendiente&orden=${orderNumber}`,
            failure: `${FRONT_URL}/?pago=rechazado&orden=${orderNumber}`,
          },
          auto_return: 'approved',
        },
      });
      await pool.execute('UPDATE orders SET mp_preference_id = ? WHERE id = ?', [pref.id, id]);
      return res.json({ orderId: id, orderNumber, initPoint: pref.init_point, total });
    }

    // Sin token MP configurado: queda en pendiente_pago (modo prueba local)
    res.json({ orderId: id, orderNumber, initPoint: null, total, warning: 'MP_ACCESS_TOKEN no configurado: la orden quedó pendiente de pago.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Confirma un pedido como pagado (llamado por webhook o return de MP). */
async function creditOrder(orderId, mpPaymentId, status) {
  const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
  const o = rows[0];
  if (!o || o.status !== 'pendiente_pago') return false;
  const settlement = j(o.settlement_json, null) || calcSettlement(o.total, 'mercadopago');
  await pool.execute(
    "UPDATE orders SET status = 'en_preparacion', mp_payment_id = ?, settlement_json = ? WHERE id = ?",
    [mpPaymentId, JSON.stringify(settlement), orderId],
  );
  await pool.execute(
    'INSERT INTO sellers (id, store_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE store_name = store_name',
    [`sel-${o.seller_store.replace(/\W/g, '') || 'default'}`, o.seller_store],
  );
  await notify(o.buyer_email, 'order_status',
    `✅ Pago acreditado · Pedido ${o.order_number}`,
    `Tu pago de $${o.total} fue acreditado. El vendedor ${o.seller_store} prepara tu pedido (despacho en 24 hs).`,
    { orderId, newStatus: 'en_preparacion' });
  await notify(null, 'sale_alert', `💰 Venta ${o.order_number} confirmada`,
    `Bruto $${settlement.gross} · Comisión $${settlement.platformFee} · Neto vendedor $${settlement.netPayout}`,
    { orderId });
  return true;
}

app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const data = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(req.body.toString() || '{}');
    const paymentId = data?.data?.id || data?.resource?.split('/').pop();
    if (!paymentId || !mpPayment) return res.sendStatus(200);
    // Verificar SIEMPRE contra la API de MP (no confiar en el payload del webhook)
    const pay = await mpPayment.get({ id: paymentId });
    await pool.execute(
      'INSERT IGNORE INTO mp_payments_log (payment_id, order_id, status, amount, raw_json) VALUES (?, ?, ?, ?, ?)',
      [String(pay.id), pay.external_reference || null, pay.status, pay.transaction_amount || null, JSON.stringify(pay)],
    );
    if (pay.status === 'approved' && pay.external_reference) {
      await creditOrder(pay.external_reference, String(pay.id), pay.status);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error('webhook error', e.message);
    res.sendStatus(200); // MP reintenta igual
  }
});

/** Confirmación manual (return de MP al frontend): consulta el pago si hay query `payment_id`. */
app.get('/api/orders/:id/payment-status', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ? OR order_number = ?', [req.params.id, req.params.id]);
  const o = rows[0];
  if (!o) return res.status(404).json({ error: 'Orden no encontrada' });
  if (o.status === 'pendiente_pago' && o.mp_payment_id && mpPayment) {
    const pay = await mpPayment.get({ id: o.mp_payment_id });
    if (pay.status === 'approved') await creditOrder(o.id, String(pay.id), pay.status);
  }
  const [updated] = await pool.execute('SELECT * FROM orders WHERE id = ?', [o.id]);
  res.json({ status: updated[0].status, order: orderRowToApi(updated[0]) });
});

// ══════════════════ ÓRDENES ══════════════════
app.get('/api/orders', auth(), async (req, res) => {
  let rows;
  if (req.user.store_name) {
    [rows] = await pool.execute('SELECT * FROM orders WHERE seller_store = ? ORDER BY created_at DESC', [req.user.store_name]);
  } else {
    [rows] = await pool.execute('SELECT * FROM orders WHERE buyer_email = ? ORDER BY created_at DESC', [req.user.email]);
  }
  res.json(rows.map(orderRowToApi));
});

/** El vendedor confirma el envío → notificación al comprador. */
app.patch('/api/orders/:id/status', auth(), async (req, res) => {
  const { status } = req.body || {};
  const valid = ['en_preparacion', 'despachado', 'completado', 'cancelado'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Estado inválido' });
  const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  const o = rows[0];
  if (!o) return res.status(404).json({ error: 'Orden no encontrada' });
  // El vendedor solo toca sus órdenes; el comprador nada (usa disputas).
  if (req.user.store_name && o.seller_store !== req.user.store_name && !req.user.is_staff) {
    return res.status(403).json({ error: 'No autorizado para esta orden' });
  }
  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, o.id]);
  const labels = {
    en_preparacion: 'en preparación de despacho',
    despachado: 'DESPACHADO y en camino 🚚',
    completado: 'entregado',
    cancelado: 'cancelado',
  };
  await notify(o.buyer_email, 'order_status',
    `📦 Tu pedido ${o.order_number} fue ${labels[status]}`,
    status === 'despachado'
      ? `El vendedor ${o.seller_store} confirmó el envío. Tu compra está en camino (estimado 24–96 hs). Seguí el estado en tu cuenta.`
      : `El estado de tu pedido cambió a: ${labels[status]}.`,
    { orderId: o.id, newStatus: status });
  res.json({ ok: true });
});

// ══════════════════ PAYOUTS (liquidaciones vendedor) ══════════════════
app.post('/api/payouts', auth(), async (req, res) => {
  const store = req.user.store_name;
  if (!store) return res.status(403).json({ error: 'Solo vendedores' });
  const [rows] = await pool.execute(
    "SELECT * FROM orders WHERE seller_store = ? AND payout_status = 'pendiente' AND status != 'cancelado' AND status != 'pendiente_pago'",
    [store],
  );
  if (!rows.length) return res.status(400).json({ error: 'Sin saldo pendiente' });
  const sum = (f) => rows.reduce((s, o) => s + (j(o.settlement_json, {})[f] ?? 0), 0);
  const payout = {
    id: `pay-${Date.now()}`, seller_store: store,
    order_ids: rows.map((r) => r.id),
    gross: sum('gross'), platformFee: sum('platformFee'), gatewayFee: sum('gatewayFee'), netAmount: sum('netPayout'),
    status: 'pendiente', created_at: new Date().toISOString(),
  };
  await pool.execute(
    'INSERT INTO payouts (id, seller_store, order_ids, gross, platform_fee, gateway_fee, net_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [payout.id, store, JSON.stringify(payout.order_ids), payout.gross, payout.platformFee, payout.gatewayFee, payout.netAmount, 'pendiente'],
  );
  await pool.execute(
    `UPDATE orders SET payout_status = 'liberado' WHERE id IN (${rows.map(() => '?').join(',')})`,
    rows.map((r) => r.id),
  );
  res.json(payout);
});

app.get('/api/payouts', auth(), async (req, res) => {
  const [rows] = req.user.store_name && !req.user.is_staff
    ? await pool.execute('SELECT * FROM payouts WHERE seller_store = ? ORDER BY created_at DESC', [req.user.store_name])
    : await pool.execute('SELECT * FROM payouts ORDER BY created_at DESC');
  res.json(rows.map((r) => ({
    id: r.id, sellerName: r.seller_store, orderIds: j(r.order_ids, []),
    gross: r.gross, platformFee: r.platform_fee, gatewayFee: r.gateway_fee, netAmount: r.net_amount,
    status: r.status, createdAt: r.created_at, transferredAt: r.transferred_at, transferReceipt: r.transfer_receipt,
  })));
});

app.patch('/api/payouts/:id/transfer', auth(), async (req, res) => {
  if (!req.user.is_staff) return res.status(403).json({ error: 'Solo staff' });
  const receipt = `TR-${Date.now()}`;
  await pool.execute("UPDATE payouts SET status = 'transferido', transfer_receipt = ?, transferred_at = NOW() WHERE id = ?", [receipt, req.params.id]);
  res.json({ ok: true, receipt });
});

// ══════════════════ NOTIFICACIONES ══════════════════
app.get('/api/notifications', auth(), async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.email],
  );
  res.json(rows.map((r) => ({
    id: r.id, type: r.type, title: r.title, body: r.body,
    read: !!r.read_flag, timestamp: r.created_at, metadata: j(r.metadata_json, {}),
  })));
});

app.patch('/api/notifications/read', auth(), async (req, res) => {
  await pool.execute('UPDATE notifications SET read_flag = 1 WHERE user_email = ?', [req.user.email]);
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, mp: !!mpClient }));

app.listen(PORT, () => console.log(`solooutlet API en http://localhost:${PORT} · MP: ${mpClient ? 'CONFIGURADO' : 'sin token'}`));
