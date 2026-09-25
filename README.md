# solooutlet — Marketplace de Outlet & Liquidación

Marketplace vertical donde comercios liquidan devoluciones, productos sin caja,
con detalles estéticos o reacondicionados, con transparencia total de estado
(Sistema de Grados A/B/C), pagos simulados estilo Mercado Pago y liquidación
automática de comisiones a vendedores.

Stack: **React 19 + Vite 8 + Tailwind CSS 4 + TypeScript** (sin backend todavía;
los datos viven en `localStorage` a través de una capa lista para migrar a API).

## Puesta en marcha (cualquier editor)

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # genera dist/
bun run lint     # tsc --noEmit
```

> Alternativa con npm: `npm install --legacy-peer-deps` (flag necesario por
> un conflicto entre `vite@8` y `esbuild`; ver `package.json`: `esbuild ^0.28.2`).

## Roles

| Rol | Ve | No ve |
|---|---|---|
| Comprador / invitado | Inicio, Catálogo, Favoritos, carrito, Mi Cuenta, Ayuda | Vender, Publicar, Mi Tienda, Admin |
| Vendedor (`merchant_approved`) | + Mi Tienda (pedidos, stock, equipo, publicidad, integraciones, finanzas), Publicar Lote | Admin global |
| Staff (`PLATFORM_OWNER_EMAILS` en `src/utils/sellerWorkspace.ts`) | + Panel Admin (ventas, inventario, liquidaciones) | — |

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
    commissions.ts        # comisión 8%, cupones, envíos, settlement
    sellerWorkspace.ts    # roles, permisos, PLATFORM_OWNER_EMAILS
    formatters.ts         # moneda ARS, badges, grados
  components/             # vistas comprador + workspace vendedor + admin
```

## Reglas de negocio clave

- **Comisión**: 8% automática por venta (mínimo $100) + costo de pasarela.
  El neto queda `pendiente` y se transfiere al CBU/alias del vendedor.
- **Pedidos**: `en_preparacion → despachado → completado`, más `cancelado`
  (devuelve stock, anula dinero) y `returnRequested` (devolución).
- **Cupones**: `OUTLET10`, `BIENVENIDA15` (ver `COUPONS`).
- **Envíos**: estándar (gratis +$150k) y expreso (gratis +$300k).

## Migrar a base de datos

1. Levantá tu API y definí `VITE_API_URL` en un `.env` (ver `.env.example`).
2. `src/data/db.ts` ya centraliza `load/persist/forget`: implementá ahí los
   endpoints (`GET/PUT /sync/:key` o uno por recurso) sin tocar el resto.
3. Los tipos de `src/types.ts` son tu esquema inicial de tablas
   (`products`, `orders`, `sellers`, `payouts`, `users`).
4. Cobros reales: conectar Mercado Pago (`application_fee` = `settlement.platformFee`).
