# Desplegar el backend + MySQL y conectar el frontend (cuentas reales)

Esta guía deja solooutlet con **cuentas reales entre dispositivos**: el frontend
en GitHub Pages apuntando a la API con `VITE_API_URL`, y la API (Express + MySQL)
corriendo en Railway (recomendado, MySQL incluido) o Render.

---

## Opción A — Railway (recomendado: MySQL + API en un solo lugar)

### 1. Crear el proyecto y la base de datos

1. Entrá a <https://railway.com> con tu cuenta de GitHub → **New Project**.
2. Elegí **Deploy MySQL** (primero la base) → Railway te da:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
   - Un host público si activás **Public Networking** en el servicio MySQL (para migrar; no hace falta exponerlo).
3. En el mismo proyecto → **New Service → GitHub Repo** → elegí `MarianGallicchio/SOLOOUTLET`.
4. En el servicio de la API → **Settings**:
   - **Root Directory**: `SOLOOUTLET` (si el repo tiene la carpeta) o vacío según tu layout.
   - **Start Command**: `node server/index.js`
   - **Networking → Generate Domain**: anotá la URL (ej: `https://solooutlet-api.up.railway.app`).

### 2. Variables de entorno del servicio API (Railway → Variables)

| Variable | Valor |
|---|---|
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` (referencia al servicio MySQL) |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |
| `JWT_SECRET` | Una cadena larga aleatoria (ej: `openssl rand -hex 32`) |
| `FRONT_URL` | `https://mariangallicchio.github.io/SOLOOUTLET` |
| `MP_ACCESS_TOKEN` | Tu token de producción de Mercado Pago (opcional para arrancar) |
| `MP_OAUTH_SECRET` | Secreto para cifrar tokens OAuth de vendedores (obligatorio para conectar MP) |
| `RESEND_API_KEY` | (opcional) clave de [resend.com](https://resend.com) para enviar emails de recuperación |
| `RESET_EMAIL_FROM` | (opcional) `solooutlet <tucasilla@tudominio>` |
| `ALLOW_RESET_CODE` | Dejar **sin definir** en producción (el código de recuperación solo va por email) |

> Las tablas se **crean solas** al arrancar (auto-inicialización idempotente desde
> `server/schema.sql` + migraciones). No hace falta ejecutar SQL a mano.

### 3. Verificar

```
https://TU-API.up.railway.app/api/health
→ {"ok":true,"db":"up","mp":...}
```

---

## Opción B — Render (API gratis + MySQL de pago o externo)

1. <https://render.com> → **New → Web Service** → conectá el repo.
2. **Build Command**: `npm install` · **Start Command**: `node server/index.js`.
3. **Environment**: mismas variables que en Railway (si la DB es Railway MySQL,
   usá el host público `proxy.rlwy.net` + puerto que Railway expone).
4. Health Check Path: `/api/health`.

---

## 4. Conectar el frontend (GitHub Pages)

El frontend necesita saber la URL de la API en **build time** (`VITE_API_URL`).

### Repositorio → Settings → Secrets and variables → Actions → **New repository secret**

- Name: `VITE_API_URL`
- Value: `https://TU-API.up.railway.app/api`

Luego actualizá `.github/workflows/deploy.yml` (ya incluido en este commit) que
inyecta `VITE_API_URL` al compilar. Hacé un push (o re-run del workflow) y el
sitio de Pages pasa a **modo producción real**: cuentas, carrito y pagos contra
la API con MySQL.

> Alternativa sin Actions (bloqueo de billing): `npm run build:prod` en tu
> máquina con `VITE_API_URL` definido y push del `dist/` a la rama `gh-pages`
> (igual que venimos haciendo).

### Modo demo sigue disponible

Si el frontend se compila **sin** `VITE_API_URL`, la app arranca en modo demo
con datos locales (lo que ves hoy en Pages). Con la variable definida, la
pantalla de bloqueo desaparece y todo va contra la API.

---

## 5. Qué cambia con cuentas reales

| Función | Demo (actual) | Con API (producción) |
|---|---|---|
| Cuentas | En el navegador de cada visitante | En MySQL: mismo usuario desde cualquier dispositivo |
| Contraseñas | Hash demo FNV en localStorage | **bcrypt en el servidor** |
| Recuperación | Código mostrado en pantalla | **Email real** vía Resend |
| Carrito / pedidos | localStorage | MySQL (tabla `orders`) |
| Pagos MP | Simulados | **Split real** con `marketplace_fee` |
| Vendedores | Auto-aprobados | Flujo admin: pendiente → aprobado |
