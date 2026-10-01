# solooutlet — Presentación Empresarial

**Marketplace de outlet con auto-logística · El comercio vende, la plataforma ancla.**

---

## 1. Resumen ejecutivo

solooutlet es un marketplace B2B2C donde los comercios liquidan devoluciones comerciales, productos sin caja, reacondicionados o con detalles estéticos mínimos, con transparencia certificada foto por foto.

**El modelo de anclaje:** el comercio no toca el envío ni cobra directo. solooutlet retiene el pago del comprador, gestiona la logística con couriers integrados y libera el dinero del vendedor solo cuando la entrega está confirmada. La confianza del ecosistema pasa por la plataforma.

- **Para compradores:** ahorro real de hasta 75% con estado del producto certificado.
- **Para comercios:** liquidación de stock estancado sin canales informales, con pagos protegidos y logística incluida.
- **Para la plataforma:** comisión por transacción (10% hasta $50.000, 8% por encima, mínimo $100) + control del flujo de dinero.

---

## 2. Funciones del COMPRADOR

### 2.1 Cuenta y seguridad
| Función | Detalle |
|---|---|
| Registro | Email + contraseña (mínimo 6 caracteres, guardada con hash) |
| Login | Validación completa con mensajes de error claros |
| Recordarme | Sesión de 30 días (cookie `so_session_remember`) |
| Recuperación de contraseña | Código de 6 dígitos, expira en 10 min, máx. 5 intentos, hasheado |
| Verificación de email | Código de 6 dígitos (15 min), badge "Email verificado" en perfil |
| Compras como invitado | Exploración y carrito sin cuenta; registro solo al pagar |

### 2.2 Compra
| Función | Detalle |
|---|---|
| Catálogo con filtros | Por categoría, condición (Grado A/B/C), precio, descuento, stock |
| Búsqueda en vivo | Título, descripción, specs, marca y tags mientras se escribe |
| Ficha de producto | Fotos reales, defectos declarados, qué incluye, garantía, número de serie |
| Sistema de grados | Grado A (como nuevo), B (detalle estético), C (reacondicionado) con peritaje |
| Recomendaciones | "También te puede interesar" — motor de afinidad automático |
| Carrito | Persistente (cookie 7 días), stepper de cantidad, checkout en pasos |
| Medios de pago | Mercado Pago, tarjeta de crédito (hasta 12 cuotas), débito, transferencia |
| Cupones y envío | Códigos de descuento, opción estándar/express con cotización |
| Favoritos | Lista de deseados persistente |
| Seguimiento de envío | Timeline en vivo: pago → preparación → tránsito → reparto → entrega, con historial real del courier |
| Notificaciones push | Cada cambio de estado del pedido avisa al comprador |
| Historial y comprobantes | Repetir compra, imprimir comprobante, chat post-venta |
| Disputas | Solo por fraude/error grave ("no recibí", "no coincide"); ventas finales |

### 2.3 Confianza
- Fotos 100% reales del lote (obligatorias, incluida foto del defecto).
- Garantía del fabricante declarada por publicación.
- Reseñas y calificaciones visibles por producto.
- Política de cookies completa (Ley 25.326/GDPR) con consentimiento granular, exportación y revocación.

---

## 3. Funciones del VENDEDOR (comercio)

### 3.1 Onboarding
| Función | Detalle |
|---|---|
| Registro de comercio | Formulario con CUIT, categoría y volumen de stock; aprobación inmediata en demo |
| Cuenta separada | El rol vendedor es independiente del comprador |
| Botón demo | "Entrar como vendedor demo" crea/loguea una tienda de ejemplo en 1 click |
| Publicación guiada | Formulario en 4 pasos con 3 fotos obligatorias (principal, defecto, ángulo) y validación en vivo |

### 3.2 Panel Mi Tienda (workspace)
| Módulo | Funciones |
|---|---|
| Resumen | Métricas con contadores animados, KPIs: facturación bruta, neto a liquidar, pedidos, ticket promedio |
| Publicar | Alta de lotes con estado, specs, garantía, SKU; fotos desde celular o PC |
| Pedidos | Estados (preparación → despachado → entregado), datos del comprador, desglose de comisión por orden |
| Estadísticas | Productos con mayor salida, historial completo |
| Empleados | Invitación por email con roles: Dueño, Administrador, Ventas, Depósito, Marketing |
| Publicidad | Campañas de boost (básica/premium) gestionables desde el panel |
| Integraciones | Catálogo de conexiones (Mercado Pago, couriers) con toggles |
| Interface de prueba | Datos demo protegidos para mostrar el panel sin datos reales |

### 3.3 Auto-logística (el anclaje)
| Función | Detalle |
|---|---|
| Etiqueta en 1 click | Comparación de couriers con precio y ETA: Andreani, OCA, Correo Argentino, retiro en local |
| Cotización automática | Base + peso, con recargo de zona patagónica |
| Etiqueta imprimible | PDF/imprimir con destinatario, remitente y código de barras |
| Tracking de 5 estados | Etiqueta → retirado → en tránsito → en reparto → entregado |
| Notificaciones al comprador | Cada escaneo del courier dispara aviso con número de tracking |
| SLA de retiro 48 h | Si el courier no retira, la orden se marca en rojo y el pago queda retenido |
| Liquidación por entrega | El neto del vendedor se libera solo con entrega confirmada |

### 3.4 Dinero
| Función | Detalle |
|---|---|
| Split automático | Comisión retenida en cada venta: 10% hasta $50.000, 8% por encima, mínimo $100 |
| Fee de pasarela visible | 1,9% de Mercado Pago desglosado en cada orden |
| Saldo pendiente | Acumulación automática por venta |
| Retiros | Solicitud de payout con estados (pendiente → liberado → transferido) |

---

## 4. Funciones de PLATAFORMA (mod / dueño)

| Función | Detalle |
|---|---|
| Centro Global de Analíticas | Ventas totales, comercios activos, comisiones retenidas |
| Aprobación de comercios | Panel de solicitudes (pending → contacted → approved) |
| Acceso rápido | Botón "Entrar como mod" en el login |

---

## 5. Arquitectura y estado técnico

| Componente | Estado |
|---|---|
| Frontend | React 19 + Vite + Tailwind 4, animaciones Anime.js v4 |
| Deploy | GitHub Pages (rama gh-pages), build automático con base `/SOLOOUTLET/` |
| Modo demo | localStorage; activo en github.io o `?demo=1`, con datos precargados (tienda ElectroPlaza) |
| Backend (listo para desplegar) | API Express + MySQL en `server/`: auth con bcrypt, password-reset y verificación por email real (Resend), init automático de tablas, `/api/health` |
| Guía de deploy | `DEPLOY.md`: pasos Railway/Render + variable `VITE_API_URL` |

### Pendientes del dueño (requieren tu cuenta)
1. **Railway:** crear proyecto → MySQL + deploy de `server/` → copiar URL.
2. **Resend:** API key para emails reales de recuperación/verificación.
3. **Redesplegar frontend** con `VITE_API_URL` apuntando a la API.
4. **Mercado Pago:** credenciales de producción para pagos reales.
5. **Andreani/OCA:** contrato comercial para etiquetas y tracking reales (el código ya tiene los 2 puntos de reemplazo).

---

## 6. Roadmap sugerido

| Corto plazo | Mediano plazo |
|---|---|
| Deploy backend en Railway | Integración courier real (Andreani API) |
| Credenciales Mercado Pago producción | PWA + notificaciones push nativas |
| Video demo comercial | Liquidaciones flash con precio decreciente |
| Primeros 5 comercios piloto | Reputación pública de tiendas + chat post-venta |

---

*Documento generado como parte del paquete de presentación de solooutlet. Sitio: https://mariangallicchio.github.io/SOLOOUTLET/*
