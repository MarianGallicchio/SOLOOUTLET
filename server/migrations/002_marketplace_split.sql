-- ============================================================
-- solooutlet — Migración 002: marketplace con split de pagos MP
-- Ejecutar: mysql -u root -p solooutlet < server/migrations/002_marketplace_split.sql
-- ============================================================
USE solooutlet;

-- ── Roles con estado de aprobación de vendedor ──
ALTER TABLE users
  MODIFY COLUMN role ENUM('buyer','seller','admin','merchant_candidate','merchant_approved')
    NOT NULL DEFAULT 'buyer',
  ADD COLUMN IF NOT EXISTS seller_status ENUM('pending','approved','rejected') NULL,
  ADD COLUMN IF NOT EXISTS seller_rejected_reason VARCHAR(240) NULL;

-- Compatibilidad: migrar cuentas vendedoras viejas
UPDATE users SET role = 'seller', seller_status = 'approved'
WHERE role IN ('merchant_approved') AND seller_status IS NULL;

-- ── Perfil de vendedor: datos fiscales + credenciales MP cifradas ──
CREATE TABLE IF NOT EXISTS seller_profiles (
  user_id           VARCHAR(40)  PRIMARY KEY,
  store_name        VARCHAR(120) NOT NULL,
  cuit              VARCHAR(20)  NULL,
  business_name     VARCHAR(160) NULL,
  contact_person    VARCHAR(120) NULL,
  whatsapp          VARCHAR(40)  NULL,
  category          VARCHAR(40)  NULL,
  cbu               VARCHAR(40)  NULL,
  alias             VARCHAR(80)  NULL,
  -- Credenciales OAuth de Mercado Pago (CIFRADAS con APP_SECRET, ver server/mpOAuth.js)
  mp_user_id        VARCHAR(40)  NULL,
  mp_access_token   VARBINARY(1024) NULL COMMENT 'AES-256-GCM',
  mp_refresh_token  VARBINARY(1024) NULL COMMENT 'AES-256-GCM',
  mp_token_expires_at DATETIME   NULL,
  mp_connected_at   DATETIME     NULL,
  approved_by       VARCHAR(40)  NULL,
  approved_at       DATETIME     NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Log de pagos MP: sumar marketplace_fee y reparto ──
ALTER TABLE mp_payments_log
  ADD COLUMN IF NOT EXISTS marketplace_fee INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS seller_amount INT UNSIGNED NULL;
