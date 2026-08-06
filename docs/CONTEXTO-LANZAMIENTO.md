# Nitid — Contexto para decisiones de lanzamiento (Play Store, marketing, optimización)

> Documento pensado para entregarse a otra IA como contexto de negocio/producto antes de decisiones
> sobre publicación en Google Play, estrategia de marketing y optimización. No sustituye a
> `CONTEXTO-APP-PARA-IA.md` (auditoría técnica de código/arquitectura) — este documento cubre el ángulo
> de negocio y lanzamiento. Generado a partir de una revisión directa del código en julio de 2026;
> actualízalo si el proyecto avanza significativamente después de esta fecha.

## 1. Qué es el producto

**Nitid** es una PWA de finanzas personales (registro manual de ingresos/gastos, fondos de ahorro con
metas, inversión por porcentajes, presupuestos, análisis mensual/anual con gráficos). Modelo freemium.
Todo en español, sin internacionalización.

**Propuesta de valor diferencial**: entrada 100% manual, sin conexión bancaria (Open Banking/Plaid-style).
Esto es tanto una limitación (fricción de uso) como un argumento de marketing explícito ya usado en el
copy de la app: *"Nunca nos conectamos con tu banco, no accedemos a tus cuentas bancarias, y no
obtenemos información financiera de ninguna fuente externa"* (respuesta a la pregunta de FAQ "¿Nitid se
conecta con mi banco?"). Es una app de **control consciente**, no de agregación automática — el
posicionamiento de marketing debería apoyarse en esto (privacidad, control, ningún dato compartido con
terceros) en vez de competir en comodidad/automatización con apps tipo Fintonic/Mint.

Otro dato de posicionamiento: **cero analítica, cero cookies de rastreo, cero SDKs publicitarios** —
declarado explícitamente en la política de privacidad. Coherente con el mensaje de privacidad, pero
también significa que **hoy no hay ningún dato de comportamiento de usuario** (funnels, retención,
puntos de abandono) para informar decisiones de producto/marketing — ver sección 7.

## 2. Modelo de negocio actual

- **Precio**: 2,99 €/mes o 29,99 €/año (equivale a 2,50 €/mes, "ahorra 16%"). Sin prueba gratuita
  visible en el código.
- **Pasarela de pago: Lemon Squeezy**, NO Google Play Billing. El checkout se abre como overlay
  (lemon.js) dentro de la propia PWA. Lemon Squeezy actúa como Merchant of Record.
- **Esto es el punto más crítico a resolver antes de subir a Play Store** (ver sección 4).
- Activación de premium vía webhook (`api/lemonsqueezy-webhook.ts`, función serverless en Vercel) que
  escribe en `subscriptions` (Supabase) tras validar firma HMAC. Eventos manejados:
  `subscription_created/updated/cancelled/expired/payment_failed`.
- No hay planes gratuitos con anuncios ni ningún otro canal de monetización.

## 3. Qué diferencia free de premium (para decidir si el corte actual tiene sentido comercial)

**Free** puede usar la app de forma completa pero con límites de creación (no de datos):
- Máx. 2 fondos de ahorro, 6 categorías fijas + 6 variables.
- Historial navegable: solo últimos 6 meses.
- Sin subcategorías ni presupuesto por categoría (solo presupuesto global de gasto variable).
- Sin metas de ahorro por fondo, sin gestión de activos de inversión individual (solo total agregado),
  sin poder invertir.
- Sin gasto dividido (cubrir con fondo cuando el ahorro no llega) — se guarda todo como gasto ordinario.
- Sparkline de tendencia recortado a 3 meses (vs 6).
- Insights automáticos: solo ve "tasa de ahorro" (el resto —subida de categoría, rachas de presupuesto,
  bajada de gasto variable, racha de ahorro— son premium, sirven de anzuelo).
- Pestaña Anual: prácticamente todo bloqueado tras un muro premium (es la pestaña más restringida).
- Aviso automático (una vez) al llegar a 500€ ahorrados, empujando a premium.
- **Importante**: importar un backup completo (incluso de una cuenta premium) NUNCA se bloquea — solo
  se restringe la creación de nuevos elementos después. Esto significa que un usuario free puede
  "heredar" más datos de los que su plan permitiría crear, y la app lo tolera con un mecanismo de
  "elige cuáles activar" (fondos/categorías por encima del límite quedan visibles pero no operables
  hasta que el usuario elige cuáles activar).

**Premium**: todo desbloqueado, fondos/categorías ilimitados, historial completo, subcategorías +
presupuesto granular, metas de ahorro con proyección, inversión con desglose, los 6 gráficos anuales,
exportación a Excel, iconos de fondo exclusivos.

Esto da una base sólida para decidir mensajería de conversión: el gancho más fuerte estructuralmente es
la pestaña **Anual** (casi todo bloqueado) y el aviso de los 500€ ahorrados.

## 4. Bloqueadores conocidos para publicar en Google Play (leer antes de planificar fecha de lanzamiento)

1. **No existe ningún wrapper nativo/TWA todavía.** El repo es una PWA pura (Vite + `vite-plugin-pwa`),
   sin carpeta `android/`, sin Capacitor, sin Bubblewrap configurado. Para publicar en Play Store hace
   falta generar un TWA (Trusted Web Activity) — normalmente con
   [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap) o
   [PWABuilder](https://www.pwabuilder.com/) — y configurar Digital Asset Links (`assetlinks.json`
   servido desde el dominio) para verificar la propiedad. Esto no se ha empezado.
2. **Riesgo de política de Google Play Billing.** Google exige que las compras de contenido digital
   dentro de la app usen Google Play Billing (comisión 15-30%), salvo excepciones (apps "reader",
   ciertos casos de suscripciones de servicios prestados fuera de la app). Un TWA que abre un checkout
   externo (Lemon Squeezy) para desbloquear funciones **dentro** de la misma app es exactamente el caso
   que Google suele rechazar o exigir migrar a Play Billing. Esto necesita decidirse explícitamente:
   (a) migrar el cobro a Google Play Billing para la versión Android (duplicando lógica de
   suscripción/webhooks), (b) intentar encajar en alguna excepción de política (poco probable para una
   app de gestión financiera), o (c) mantener Lemon Squeezy solo en la versión web y publicar la app de
   Play como "gratuita" con el premium gestionado igual vía login (más aceptable si se puede argumentar
   que la suscripción es de un "servicio multiplataforma" ya contratado en la web, similar a cómo
   Netflix/Spotify lo resuelven — pero incluso ellos ya no pueden ofrecer el botón de compra dentro de
   la app Android). Esta es la decisión de mayor impacto a resolver antes de nada más.
3. **Política de privacidad con placeholders sin rellenar**: `/privacy.html` y el modal in-app tienen
   `[FECHA]`, `[TU NOMBRE COMPLETO]`, `[TU EMAIL]`, `[TU CIUDAD, PAÍS]` literalmente sin sustituir.
   Google Play exige una política de privacidad real y accesible para completar la sección "Seguridad
   de los datos" (Data safety) del listado.
4. **Sin dominio propio**: la app vive en `finzanzas-freemium-xi.vercel.app` (subdominio Vercel, con el
   nombre viejo "Finzanzas" en la URL, no "Nitid"). Para un TWA y para la ficha de Play Store conviene
   un dominio propio coherente con la marca (p. ej. `nitidfinanzas.com` o similar) antes de publicar —
   cambiar de dominio después de publicar en Play complica los Digital Asset Links.
5. **Icono "maskable" no configurado**: el manifest actual solo declara dos iconos PNG normales
   (192/512), sin variante `purpose: "maskable"`. Android la necesita para el icono adaptativo; sin
   ella, el icono puede recortarse mal en la mayoría de launchers.
6. **Sin assets de ficha de Play Store**: no hay capturas de pantalla, feature graphic, icono de alta
   resolución para la Play Console, ni textos de listado (descripción corta/larga) preparados en el
   repo — habría que producirlos.
7. **Formulario "Data safety" de Play Console**: dado que la app SÍ recoge email/contraseña y datos
   financieros (aunque no los comparta con terceros con fines publicitarios), hay que rellenar con
   precisión qué se recoge, para qué, y si se puede borrar — el contenido de la política de privacidad
   (sección 11, "Información adicional para Google Play") ya está redactado pensando en esto y puede
   servir de base directa para ese formulario.

## 5. Estado del branding

- Nombre: **Mis cuentas** → **Klaro** → **Nitid** (dos rebrandings ya hechos, todo el código/textos ya
  usan "Nitid" de forma consistente).
- Iconos de PWA/app ya actualizados a diseño de marca real (dejaron de ser placeholders durante este
  mismo proyecto).
- Tienda de Lemon Squeezy renombrada a `nitidfinanzas.lemonsqueezy.com`.
- Colores de marca: navy `#1e293b` (slate-800) como color principal/cabecera, acento teal
  (`#0f766e`/`#14b8a6`) para ahorro/positivo, ámbar para avisos, rosa/rose para gasto.
- Tipografía: `font-serif` para títulos/números destacados, sans para el resto (mobile-first, texto
  mínimo 16px para evitar zoom automático de iOS).

## 6. Stack técnico (relevante para "optimización")

- React 19 + TypeScript + Vite 8, sin router (una sola vista, pestañas por estado), Tailwind v4,
  Recharts, Supabase (Postgres + Auth + RLS).
- **Sin analítica de ningún tipo** (ni propia ni de terceros) — decisión deliberada de privacidad, pero
  implica que hoy no hay datos de uso real para priorizar optimizaciones. Si se plantea añadir
  analítica, debe ser sin cookies de tracking de terceros para no romper la promesa ya hecha en la
  política de privacidad (opciones compatibles: analítica propia server-side, o herramientas
  "privacy-first" tipo Plausible/Fathom sin cookies).
- **Sin tests automatizados** (ni unitarios ni e2e).
- **Bundle único de ~1 MB** (aviso de Vite en cada build) — el JS principal ronda 1 MB (282 KB gzip) +
  ExcelJS ~930 KB (256 KB gzip) cargados sin code-splitting. Candidato claro a lazy-loading (ExcelJS
  solo se usa al exportar, no debería ir en el bundle inicial).
- Service worker con precache (`generateSW`), funciona offline para el shell de la app; los datos en sí
  requieren red (Supabase).
- Despliegue: Vercel, auto-deploy en cada push a `main`.

## 7. Vacíos de datos para decisiones informadas

- **No hay analítica de producto**: sin funnel de registro→activación→conversión a premium, sin datos
  de qué pantallas se usan más, sin tasa de abandono del checkout.
- **No hay número real de usuarios/instalaciones** conocido — el proyecto está en fase temprana (la
  única cuenta premium confirmada es la del propio desarrollador).
- No hay reviews ni feedback cualitativo recogido de forma sistemática (sin sistema de feedback in-app).

## 8. Documentación interna existente (por si la IA quiere profundizar en algo técnico)

- `CONTEXTO-APP-PARA-IA.md` (raíz del repo): documento técnico exhaustivo pensado para auditorías de
  código/arquitectura — modelo de datos completo, lógica de negocio, hooks, sistema freemium detallado,
  bugs históricos y patrones a vigilar. **Está desactualizado** en al menos un punto importante: sigue
  diciendo que "no se ha encontrado integración real de Stripe/cobro" — en realidad el cobro real
  (Lemon Squeezy) ya está implementado y en producción, ese documento no se actualizó tras esa
  integración.
- `docs/ESPECIFICACION-APP-FINANZAS.md`: especificación funcional original (modelo de datos en prosa,
  terminología del ahorro, reglas de negocio), anterior al sistema freemium.
- `README.md`: guía de desarrollo, también con alguna afirmación desactualizada (dice que los iconos
  PWA siguen siendo placeholders; ya no lo son).

---

## Resumen de las decisiones más importantes que necesitas tomar

1. **Cobro en Android**: ¿Google Play Billing, o mantener Lemon Squeezy y asumir el riesgo/limitación de
   política? Esto determina buena parte del trabajo técnico previo.
2. **Ruta técnica de empaquetado**: TWA (Bubblewrap/PWABuilder) es la opción natural dado que ya es una
   PWA — pero confirmar que encaja con la decisión del punto 1.
3. **Dominio propio** antes o después de publicar (afecta a Digital Asset Links si se cambia después).
4. **Completar la política de privacidad** (rellenar los placeholders) — bloqueante literal para el
   listado de Play Store.
5. **Si vale la pena añadir analítica "privacy-first"** antes del lanzamiento, para no lanzar a ciegas.
6. **Producir assets de ASO** (capturas, feature graphic, descripción optimizada a keywords en español).
