# 🎬 Guion de Demostración — solooutlet
### Flujo completo: registrar vendedor → publicar → comprar → despachar → cobrar

**Duración estimada:** 8–10 minutos
**URL demo:** https://mariangallicchio.github.io/SOLOOUTLET/
**Modo:** la demo corre en "modo demo" (datos locales del navegador) salvo que se conecte la API. El guion sirve igual para ambos; las diferencias se marcan con ⚙️.

> **Antes de empezar:** refrescá con **Ctrl+F5**, aceptá cookies ("Aceptar todas") y usá una ventana de incógnito aparte para el rol comprador. Así mostrás cuentas separadas reales.

---

## Preparación (antes de la audiencia)

- [ ] Página cargada y banner de cookies aceptado (muestra madurez legal: Ley 25.326).
- [ ] Dos perfiles listos: **ventana 1 = vendedor**, **ventana 2 (incógnito) = comprador**.
- [ ] Si hay backend conectado (⚙️): verificar `https://tu-api.up.railway.app/api/health` → `{"ok":true,"db":"up"}`.
- [ ] Cierre de otras pestañas para no mostrar datos ajenos.

---

## Escena 1 — El problema y la solución (1 min)

**Qué decir:** "Los comercios tienen stock inmovilizado: devoluciones, productos sin caja, con detalles estéticos. Los compradores quieren ahorro real con confianza. solooutlet es el marketplace que conecta ambos con **transparencia radical**: cada producto declara su estado con fotos reales y peritaje."

**Qué mostrar:**
1. Home: hero, filtros de condición (Grado A/B/C).
2. Banner superior: "Estado real certificado foto por foto · Pagos protegidos con Mercado Pago".
3. Footer: señalar "Configuración de cookies" → un clic → cerrar (10 segundos, muestra cumplimiento).

---

## Escena 2 — Registrar el vendedor y su tienda (2 min)

1. Click en **Vender** (o "Registrar mi comercio" si el catálogo está vacío).
2. Modal **"Soy Comercio / Vendedor"** → sub-pestaña **"Registrar mi comercio"**.
3. Completar el formulario en vivo:
   - Razón social: `Electro Plaza S.R.L.`
   - CUIT: `30-71289412-4`
   - Contacto: `Laura Martínez`
   - WhatsApp: `11 5590-4421`
   - Rubro: `Tecnología & Computación`
   - Email: `ventas@electroplaza.com.ar`
   - Contraseña: `vendedor123` ← **aclarar: mínimo 6 caracteres, se guarda con hash en el servidor** ⚙️
4. Enviar → la tienda se crea al instante y entra a su **Centro de Ventas**.

**Qué decir:** "La cuenta vendedora es **separada** de la de comprador: cada rol ve exactamente lo que necesita. El panel es un centro de control de ventas, no una página más."

**Mostrar del panel:**
- Header oscuro con métricas (facturación, neto a liquidar, por preparar).
- **"Interface de prueba"** (botón ojo 👁): activar 5 segundos para mostrar cómo se ve el panel con datos reales de actividad → desactivar. "Así se ve cuando la tienda ya vende: pedidos, dinero, métricas."

---

## Escena 3 — Publicar el primer producto (2 min)

1. Botón **"Publicar producto"** → asistente de publicación.
2. Completar:
   - Título: `Notebook 14" Core i5 8GB 256GB SSD`
   - Estado: `Devolución` (Grado A) ← aclarar qué significa
   - Categoría: `Tecnología`
   - Precio: `389999` · Precio de lista: `529999` (el descuento se calcula solo)
   - Stock: `3`
   - **Detalle de condición**: "Devolución por cambio de color dentro de 48hs. Equipo testeado, batería con 2 ciclos, pantalla impecable."
3. Publicar → aparece en el catálogo al instante.

**Qué decir:** "El detalle de condición es obligatorio: la transparencia es la característica del producto, no un extra."

---

## Escena 4 — El comprador compra (3 min) — *ventana incógnito*

1. En la incógnito: ir al **Catálogo** → abrir la notebook publicada.
2. Señalar el **Reporte Óptico de Defecto**, garantía, fotos reales, reseñas.
3. Señalar **"También te puede interesar"**: motor de recomendaciones por afinidad (categoría, precio, vendedor, ahorro).
4. **Agregar al carrito** → **Comprar ahora** → checkout:
   - Registrarse como comprador: `pedro@test.com` / `comprador123` (⃰ mostrar que es rápido).
   - En el checkout: elegir **Mercado Pago** y mostrar cuotas; opcionalmente aplicar **cupón**.
   - Confirmar.

5. ⚙️ **Con API:** redirección real a Mercado Pago y webhook que acredita el split. **Sin API:** la orden se genera en modo demo con el settlement calculado.

**Qué decir mientras se procesa:** "Cada pago se divide automáticamente: la comisión de solooutlet se retiene (10% hasta $50.000, 8% por encima, mínimo $100) y el neto va directo a la cuenta de Mercado Pago del vendedor. **Sin liquidaciones manuales.**"

---

## Escena 5 — El vendedor despacha (1.5 min) — *ventana vendedor*

1. En la ventana del vendedor → **Centro de Ventas** → la notificación de venta ya llegó (campana 🔔).
2. **Resumen** → "Pedidos por preparar" muestra la orden nueva con datos del comprador.
3. Click **"Marcar despachado"** → el comprador recibe notificación **"DESPACHADO y en camino 🚚"** al instante (mostrar la campana en la incógnito).
4. Volver al panel → **Finanzas** → el neto de esa venta ya está en "Neto pendiente".

**Qué decir:** "El comprador es notificado en tiempo real. El vendedor ve su dinero liquidado sin hacer nada más: la comisión ya fue retenida automáticamente."

---

## Escena 6 — Cierre comercial (1 min)

**Volver al home y remarcar:**

1. **Para vendedores:** "Publicás en 2 minutos, cobrás sin gestión, con panel profesional y empleados por rol."
2. **Para compradores:** "Ahorro real de hasta 75% con estado certificado y garantía."
3. **Para el negocio:** "Comisión sobre cada venta (10%/8% escalonado) con retención automática vía split de Mercado Pago."
4. CTA final según la audiencia: "¿Empezamos con tu stock?" (comercio) / "Creá tu cuenta y explorá" (comprador).

---

## Plan B: preguntas técnicas frecuentes

| Pregunta | Respuesta corta |
|---|---|
| ¿Las ventas finales? | Sí, sin devoluciones; solo disputas por fraude/error grave. Estado declarado antes de pagar. |
| ¿Cómo cobra el vendedor? | Split de Mercado Pago: neto directo a su cuenta, comisión retenida automáticamente. |
| ¿Y si el vendedor no conecta MP? | Sus ventas quedan como saldo pendiente; liquida desde Finanzas cuando conecte. |
| ¿Los datos son reales? | ⚙️ Con backend: MySQL, bcrypt, JWT, webhook idempotente de MP. En demo: todo local en el navegador. |
| ¿Robustez legal? | T&C con venta final declarada, política de cookies (Ley 25.326/GDPR), export de datos personales. |
| ¿Recuperación de cuenta? | Por código de 6 dígitos con expiración de 10 min y envío por email real (Resend). |

---

## Riesgos técnicos en vivo (y mitigación)

| Riesgo | Mitigación |
|---|---|
| Internet lento | Tener 2 capturas del flujo listo como respaldo. |
| Mercado Pago caído en demo ⚙️ | La orden queda "pendiente"; mostrar el panel igual. |
| Datos de otra demo en el navegador | Antes de arrancar: limpiar datos del sitio (candado → Borrar datos) o usar incógnito. |
| Cuenta de vendedor existente | Usar emails de prueba únicos: `demo+<hora>@solooutlet.com`. |

---

## Cheat sheet: credenciales de prueba sugeridas

| Rol | Email | Contraseña |
|---|---|---|
| Vendedor | `ventas@electroplaza.com.ar` | `vendedor123` |
| Comprador | `pedro@test.com` | `comprador123` |

> Si la demo corre con backend real (⚙️), estas cuentas persisten en MySQL y se pueden reutilizar entre dispositivos — ideal para dejar precargada una tienda con productos antes de la presentación.
