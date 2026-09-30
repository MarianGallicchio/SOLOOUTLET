-- ============================================================
-- solooutlet — Esquema MySQL / MariaDB (unificado)
-- Ejecutar: mysql -u root -p < server/schema.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS solooutlet
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE solooutlet;

-- ── Usuarios (compradores y vendedores, un solo registro por email) ──
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(40)  PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  phone         VARCHAR(40)  DEFAULT '',
  address       VARCHAR(200) DEFAULT '',
  city          VARCHAR(120) DEFAULT '',
  postal_code   VARCHAR(20)  DEFAULT '',
  role          ENUM('buyer','merchant_candidate','merchant_approved') NOT NULL DEFAULT 'buyer',
  store_name    VARCHAR(120) NULL,
  is_staff      TINYINT(1)   NOT NULL DEFAULT 0,
  email_verified TINYINT(1)  NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Tiendas vendedoras ──
CREATE TABLE IF NOT EXISTS sellers (
  id            VARCHAR(40)  PRIMARY KEY,
  store_name    VARCHAR(120) NOT NULL UNIQUE,
  owner_email   VARCHAR(160) NULL,
  cbu           VARCHAR(40)  NULL,
  alias         VARCHAR(80)  NULL,
  mp_account    VARCHAR(160) NULL,
  commission_note VARCHAR(60) NULL COMMENT 'referencia informativa',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Productos ──
CREATE TABLE IF NOT EXISTS products (
  id                VARCHAR(40)  PRIMARY KEY,
  seller_store      VARCHAR(120) NOT NULL,
  title             VARCHAR(200) NOT NULL,
  vendor            VARCHAR(120) NOT NULL,
  estado            VARCHAR(30)  NOT NULL,
  cat               VARCHAR(40)  NOT NULL,
  price             INT UNSIGNED NOT NULL,
  original_price    INT UNSIGNED NOT NULL,
  discount          INT UNSIGNED NOT NULL DEFAULT 0,
  image             VARCHAR(500) NULL,
  stock             INT UNSIGNED NOT NULL DEFAULT 0,
  condition_details TEXT         NULL,
  description       TEXT         NULL,
  warranty_days     INT UNSIGNED NOT NULL DEFAULT 30,
  specs             TEXT         NULL,
  sku               VARCHAR(40)  NOT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_store (seller_store),
  INDEX idx_products_cat (cat)
);

-- ── Pedidos ──
CREATE TABLE IF NOT EXISTS orders (
  id              VARCHAR(40)  PRIMARY KEY,
  order_number    VARCHAR(20)  NOT NULL UNIQUE,
  buyer_email     VARCHAR(160) NOT NULL,
  customer_json   JSON         NOT NULL COMMENT 'datos de envío del comprador',
  items_json      JSON         NOT NULL COMMENT 'snapshot de items',
  subtotal        INT UNSIGNED NOT NULL,
  discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
  shipping        INT UNSIGNED NOT NULL DEFAULT 0,
  total           INT UNSIGNED NOT NULL,
  payment_method  VARCHAR(20)  NOT NULL,
  payment_json    JSON         NULL,
  status          ENUM('pendiente_pago','en_preparacion','despachado','completado','cancelado') NOT NULL DEFAULT 'pendiente_pago',
  mp_preference_id VARCHAR(120) NULL,
  mp_payment_id   VARCHAR(60)  NULL,
  settlement_json JSON         NULL,
  seller_store    VARCHAR(120) NOT NULL,
  payout_status   ENUM('pendiente','liberado','transferido','retenido') DEFAULT 'pendiente',
  payout_release_at DATETIME   NULL,
  dispute_json    JSON         NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_buyer (buyer_email),
  INDEX idx_orders_seller (seller_store),
  INDEX idx_orders_status (status)
);

-- ── Liquidaciones (payouts) al vendedor ──
CREATE TABLE IF NOT EXISTS payouts (
  id             VARCHAR(40)  PRIMARY KEY,
  seller_store   VARCHAR(120) NOT NULL,
  order_ids      JSON         NOT NULL,
  gross          INT UNSIGNED NOT NULL,
  platform_fee   INT UNSIGNED NOT NULL,
  gateway_fee    INT UNSIGNED NOT NULL,
  net_amount     INT UNSIGNED NOT NULL,
  status         ENUM('pendiente','transferido') NOT NULL DEFAULT 'pendiente',
  transfer_receipt VARCHAR(60) NULL,
  transferred_at DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payouts_seller (seller_store)
);

-- ── Notificaciones push (por usuario) ──
CREATE TABLE IF NOT EXISTS notifications (
  id         VARCHAR(40)  PRIMARY KEY,
  user_email VARCHAR(160) NOT NULL,
  type       ENUM('order_status','chat_message','sale_alert','system') NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT         NOT NULL,
  read_flag  TINYINT(1)   NOT NULL DEFAULT 0,
  metadata_json JSON      NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_email)
);

-- ── Registro de pagos Mercado Pago (webhooks) ──
CREATE TABLE IF NOT EXISTS mp_payments_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  payment_id    VARCHAR(60) NOT NULL,
  order_id      VARCHAR(40) NULL,
  status        VARCHAR(30) NOT NULL,
  amount        INT UNSIGNED NULL,
  raw_json      JSON NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mp_payment (payment_id)
);

-- ── Cupones ──
CREATE TABLE IF NOT EXISTS coupons (
  code         VARCHAR(30) PRIMARY KEY,
  rate         DECIMAL(4,3) NOT NULL,
  min_subtotal INT UNSIGNED NOT NULL,
  label        VARCHAR(120) NOT NULL,
  active       TINYINT(1) NOT NULL DEFAULT 1
);

INSERT IGNORE INTO coupons (code, rate, min_subtotal, label) VALUES
  ('OUTLET10', 0.100, 50000,  '10% OFF en tu compra'),
  ('BIENVENIDA15', 0.150, 100000, '15% OFF bienvenida');
