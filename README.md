# solooutlet — Marketplace de Outlet & Liquidación

Marketplace vertical donde comercios liquidan devoluciones, productos sin caja,
con detalles estéticos o reacondicionados, con transparencia total de estado
(Sistema de Grados A/B/C), **pagos reales con split de Mercado Pago** y
liquidación automática de comisiones a vendedores.

Stack: **React 19 + Vite 8 + Tailwind CSS 4 + TypeScript** + **backend Express + MySQL/MariaDB**
con **Mercado Pago Marketplace** (OAuth por vendedor + `marketplace_fee`).

## Arquitectura

- **Frontend** (`src/`): React + Vite. Con `VITE_API_URL` definido habla con la API;
  sin él, y solo en desarrollo o con `?demo=1`, funciona en modo demo (localStorage).
  **En producción el modo demo está bloqueado**: sin backend no hay pagos reales ni roles confiables.
- **Backend** (`server/`): Express + MySQL con JWT + bcrypt. Toda regla de dinero
  y de roles se valida en el servidor (la UI nunca decide comisiones ni permisos).
- **Roles en la base**: `users.role` = `buyer` / `seller` / `admin` (+ `seller_status`
  = `pending` / `approved` / `rejected` para vendedores). Nada de listas de emails en el front.
- **Split de pagos MP**: cada vendedor vincula su Mercado Pago por OAuth
  (tokens cifrados AES-256-GCM en `seller_profiles`); el checkout crea la
  preferencia **con el token del vendedor** y `marketplace_fee` = comisión de
  solooutlet (10% hasta $50.000, 8% por encima — calculada SIEMPRE en el backend).
  MP acredita cada parte directo en su cuenta: sin transferencias manuales.
  El módulo de liquidaciones queda como registro de lo cobrado.
- **Webhook verificado**: `POST /api/webhooks/mercadopago` consulta el pago a la API
  de MP antes de acreditar; nunca confía en redirecciones ni payloads.
- La comisión de procesamiento de Mercado Pago se la descuenta MP directamente
  al vendedor; la plataforma no la vuelve a restar (sin doble conteo).

## Puesta en marcha

Ver [SETUP.md](SETUP.md) para la guía completa (MySQL, .env, Mercado Pago,
webhook y flujo de venta). Resumen:

```bash
mysql -u root -p < server/schema.sql
mysql -u root -p solooutlet < server/migrations/002_marketplace_split.sql
cp .env.example .env        # completar MySQL + MP + Google
npm install
npm run dev:all             # frontend :3000 + API :3001
```

## Roles

| Rol | Ve | No ve |
|---|---|---|
| Comprador / invitado | Inicio, Catálogo, Favoritos, carrito, Mi Cuenta, Ayuda | Vender, Publicar, Mi Tienda, Admin |
| Vendedor (`merchant_approved`) | + Mi Tienda (pedidos, stock, equipo, publicidad, integraciones, finanzas), Publicar Lote | Admin global |
| Staff (`PLATFORM_OWNER_EMAILS` en `src/utils/sellerWorkspace.ts`) | + Panel Admin (ventas, inventario, liquidaciones) | — |

## Accesos (listos para DB)

- Roles en la base de datos: **comprador** (`buyer`), **vendedor** (`seller` con
  `seller_status`: `pending` → aprobación del admin → `approved`) y **admin**
  (campo en la tabla `users`, no una lista de emails en el frontend).
- Un vendedor recién con `approved` puede vincular su Mercado Pago (OAuth) y publicar.
- Todo el auth pasa por `src/data/auth.ts`; en modo API habla con
  `POST /api/auth/*` (email+bcrypt y Google Sign-In) y sesiona con JWT (7 días).
- Entradas: compradores por "Ingresar" (Navbar/móvil); vendedores por
  "Acceso vendedores" (footer Comercios), pestaña comercio del AuthModal
  o "Mi Tienda" una vez registrados.

## Estructura

```
src/
  App.tsx                 # routing por currentView + gates por rol
  types.ts                # Product, Order (+settlement), Seller, Payout, User…
  context/StoreContext.tsx# estado global + reglas de negocio
  data/
    mockData.ts           # catálogo y pedidos seed
    db.ts                 # CAPA DE DATOS: load/persist/forget (hoy localStorage)
  utils/
    commissions.ts        # comisión 8–10%, cupones, envíos, settlement
    sellerWorkspace.ts    # permisos de workspace (solo modo demo; en API decide el backend)
    formatters.ts         # moneda ARS, badges, grados
  components/             # vistas comprador + workspace vendedor + admin
server/
  index.js                # API Express: auth JWT, órdenes, checkout MP, webhooks
  mpOAuth.js              # OAuth MP por vendedor (tokens cifrados AES-256-GCM)
  routes/marketplace.js   # connect/callback/status MP + aprobación admin
  schema.sql, migrations/ # base MySQL unificada
```

## Reglas de negocio clave

- **Comisión**: 10% hasta $50.000, 8% por encima (mínimo $100), retenida vía
  `marketplace_fee` en el split de Mercado Pago. MP descuenta su comisión de
  procesamiento directamente al vendedor (sin doble conteo). Sin transferencias
  manuales: el reparto ocurre en el momento del pago.
- **Venta final**: sin devoluciones ni cambios. Solo se admite `dispute`
  (fraude o error grave) en pedidos entregados.
- **Garantía**: siempre del fabricante, nunca del vendedor.
- **Términos**: el checkout exige aceptación explícita antes de pagar.
- **Pedidos**: `en_preparacion → despachado → completado`, más `cancelado`
  (devuelve stock, anula dinero).
- **Cupones**: `OUTLET10`, `BIENVENIDA15` (ver `COUPONS`).
- **Envíos**: estándar (gratis +$150k) y expreso (gratis +$300k).

## Migrar a base de datos

1. Levantá tu API y definí `VITE_API_URL` en un `.env` (ver `.env.example`).
2. `src/data/db.ts` ya centraliza `load/persist/forget`: implementá ahí los
   endpoints (`GET/PUT /sync/:key` o uno por recurso) sin tocar el resto.
3. Los tipos de `src/types.ts` son tu esquema inicial de tablas
   (`products`, `orders`, `sellers`, `payouts`, `users`).
4. Cobros reales: conectar Mercado Pago (`application_fee` = `settlement.platformFee`).
