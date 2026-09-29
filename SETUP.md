# solooutlet — Puesta en marcha (MySQL + Mercado Pago real)

## 1. Requisitos
- Node.js 18+
- MySQL o MariaDB corriendo en tu ordenador

## 2. Base de datos unificada
```bash
mysql -u root -p < server/schema.sql
```
Crea la base `solooutlet` con: usuarios (compradores + vendedores), tiendas, productos, pedidos, liquidaciones, notificaciones, log de pagos MP y cupones. Todo unificado.

## 3. Configuración (.env — NO se sube a GitHub)
```bash
cp .env.example .env
```
Editá `.env`:
- `DB_PASSWORD` → tu contraseña de MySQL
- `JWT_SECRET` → una clave larga aleatoria
- `MP_ACCESS_TOKEN` → tu Access Token de https://www.mercadopago.com.ar/developers/panel/app
  - Para **probar sin cobrar**: token `TEST-...`
  - Para **cobrar de verdad**: token `APP_USR-...` (producción)

## 4. Correr todo
```bash
npm install
npm run dev:all
```
- Frontend: http://localhost:3000
- API: http://localhost:3001 (el frontend la detecta por `VITE_API_URL`)

## 5. Webhook de Mercado Pago (para producción)
En el panel de desarrolladores de MP, en tu app → **Webhooks**:
- URL: `https://TU-DOMINIO/api/webhooks/mercadopago`
- Evento: *Pagos* (`payment`)

El backend verifica cada pago contra la API de MP (nunca confía en el payload), acredita la orden, retiene la comisión y crea la notificación.

## Flujo completo implementado
1. **Comprador** paga → se crea la orden en MySQL (`pendiente_pago`) y se redirige a Mercado Pago.
2. MP llama al **webhook** → se verifica el pago → la orden pasa a `en_preparacion`, se calcula el **settlement** (comisión escalonada 15%/12%/10% + pasarela) y el comprador recibe la **notificación** "Pago acreditado".
3. **Vendedor** entra a su panel → ve la venta con bruto/comisión/neto → presiona **"Marcar despachado"**.
4. El backend cambia el estado y genera la **notificación al comprador**: "Tu pedido fue despachado y está en camino 🚚".
5. Al entregarse, el neto queda **pendiente de liquidación**: el vendedor genera su payout y el staff lo marca como transferido.

## Comisión (se descuenta automáticamente de cada venta)
| Venta bruta | Comisión solooutlet |
|---|---|
| hasta $50.000 | 15% |
| $50.001 – $200.000 | 12% |
| más de $200.000 | 10% |

El vendedor recibe: bruto − comisión − costo de pasarela (MP 5,99%, crédito 4,9%, débito 2,9%, transferencia 0%).

## Notas
- Las contraseñas se guardan con **bcrypt** (nunca en texto plano).
- La sesión usa **JWT** con expiración de 7 días.
- Venta final sin devoluciones: cubierto en los Términos y Condiciones del sitio.
