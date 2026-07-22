# Klaro

App de gestión de finanzas personales: registro de ingresos y gastos, fondos de ahorro, inversión, presupuestos y análisis con gráficos. Mobile-first, pensada como PWA instalable.

La fuente de verdad del producto es [`docs/ESPECIFICACION-APP-FINANZAS.md`](docs/ESPECIFICACION-APP-FINANZAS.md). El archivo [`docs/gestor-finanzas.jsx`](docs/gestor-finanzas.jsx) es el prototipo de referencia original (un solo archivo), conservado solo como consulta visual — el código real vive en `src/`.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Recharts (gráficos)
- lucide-react (iconos)
- Supabase (Postgres + Auth) — backend opcional, ver más abajo
- vite-plugin-pwa (manifest + service worker)

## Arrancar el proyecto

```
npm install
npm run dev
```

Abre `http://localhost:5173`. **No hace falta configurar nada más**: por defecto la app funciona en modo local (ver siguiente sección).

Otros scripts:

```
npm run build     # build de producción (tsc -b && vite build)
npm run preview   # sirve el build de producción localmente
npm run lint      # oxlint
```

## Backends: local vs Supabase

La app tiene dos backends de datos intercambiables, controlados por la variable de entorno `VITE_DATA_BACKEND`:

- **`local` (por defecto, sin `.env`)**: todos los datos se guardan en `localStorage` del navegador, con un usuario mock (`local-user`) y sin pantalla de login. Pensado para desarrollar y probar cada pantalla sin depender de un proyecto Supabase real.
- **`supabase`**: usa un proyecto Supabase real (Postgres + Auth) según el esquema en [`supabase/schema.sql`](supabase/schema.sql).

Para activar el backend Supabase:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Pega el contenido de `supabase/schema.sql` en el SQL Editor del proyecto y ejecútalo (crea las tablas, índices y políticas de Row Level Security). El archivo es idempotente (`create table if not exists`, políticas recreadas con `drop policy if exists`), así que se puede volver a ejecutar entero sin problema cada vez que se le añada algo nuevo.
3. En **Authentication > Providers > Email**, desmarca "Confirm email" — así el registro deja la sesión iniciada al instante en vez de exigir confirmar por correo antes del primer login.
4. Copia `.env.example` a `.env` y rellena:
   ```
   VITE_DATA_BACKEND=supabase
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

Con el backend `supabase` activo, la app pide login (pantalla de email/contraseña con opción de registrarse, ver `src/components/LoginScreen.tsx`). Al registrarse por primera vez, `useCategories` detecta que el usuario no tiene categorías todavía y siembra automáticamente las categorías por defecto (no hace falta ningún paso manual ni trigger en la base de datos). Cerrar sesión (botón discreto al final de Ajustes) vuelve a la pantalla de login.

Cada hook de datos (`src/hooks/use*.ts`) implementa ambas ramas con la misma API pública, así que el resto de la app (componentes, pantallas) no sabe ni le importa qué backend está activo.

## Guided tour y ayuda

La primera vez que un usuario entra (tras registrarse) ve un tour guiado interactivo: un overlay señala elementos reales de la interfaz paso a paso (spotlight con recorte, sin cubrir el elemento señalado) mientras el usuario navega la app de verdad — no es un wizard aparte. Los pasos y el texto viven en `src/lib/tourSteps.ts`; el overlay en sí en `src/components/GuidedTour.tsx`; el estado (paso actual, auto-avance al detectar la acción real del usuario) se orquesta en `App.tsx`.

El estado de "ya lo ha visto" se guarda en Supabase (tabla `user_settings`, una fila por usuario), no en `localStorage`: así, si el mismo usuario entra desde otro dispositivo o navegador, no le vuelve a aparecer. En modo local (sin Supabase) se guarda en `localStorage`, suficiente porque solo hay un usuario mock por navegador. El tour se puede volver a lanzar manualmente desde el icono `?` de la cabecera → pantalla de ayuda (`src/components/HelpModal.tsx`, FAQ + botón "Repetir tutorial").

`useOnboardingStatus.ts` calcula `loading` como un valor derivado en el propio render (`userId !== fetchedForUserId`), no como un `useState` que se actualiza desde su propio efecto: así pasa a `true` en el mismo render en que `userId` deja de ser `undefined`, sin depender de que ese efecto llegue a ejecutarse antes que el de `App.tsx`. Sin esto, al reabrir la PWA con una sesión ya persistida había una ventana de un render en la que `App.tsx` podía leer un `completed: false` "viejo" (de la fase previa sin usuario) y mostrar el tour de nuevo aunque ya estuviera completado. `App.tsx` además no evalúa nada mientras `authLoading` (de `useAuth`) siga en curso.

## Optimización móvil

La app está pensada para usarse en el móvil real (320-414px de ancho), no solo en el emulador de escritorio:

- **Safe area insets**: el header (título + icono de ayuda) y la barra de navegación inferior respetan `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` (más el padding visual normal encima), para no quedar tapados por la barra de notificaciones o la zona del gesto de inicio en móviles con notch. `index.html` ya lleva `viewport-fit=cover`, necesario para que esos valores existan.
- **Legibilidad sobre densidad**: en pantallas estrechas, cualquier fila que combine una etiqueta larga y un importe (el desglose de patrimonio en Fondos, "importe/presupuesto · % del variable" en las categorías de Mensual) se apila en líneas separadas en vez de forzar que quepan en una sola fila — así el símbolo € nunca se corta ni se solapa con el texto.
- **Teclado virtual sin descuadrar el layout**: los formularios en hoja inferior (nuevo movimiento, aplicar preestablecidos, resolver huérfanos) usan `max-height` en `dvh` (no `vh`) para adaptarse al viewport dinámico cuando el teclado empuja el contenido, y ningún campo lleva `autoFocus` — el teclado solo se abre cuando el usuario toca un campo, no automáticamente al abrir el modal.
- **Sin zoom automático al escribir**: todos los campos de texto de la app (login, formularios, edición inline) usan `text-base` (16px) como mínimo. Por debajo de 16px, iOS Safari hace zoom automático al enfocar un input y no lo deshace solo, dejando la app descuadrada hasta que el usuario hace zoom manualmente hacia atrás.
- El punto de color en el selector de meses (`MonthSwitcher.tsx`) tiene tres estados: verde si el ahorro real de ese mes es positivo, ámbar si es exactamente cero, rojo si es negativo. La comparación de signo se redondea a céntimos primero (`round2()` en `src/lib/format.ts`): restar importes en coma flotante puede dejar un resto ínfimo como `-0.00000000000003` en vez de un 0 exacto, lo que sin ese redondeo se mostraba como "-0,00 €" y pintaba el punto en rojo cuando debía ser ámbar. `fmt()` aplica el mismo redondeo, así que esto está corregido en cualquier importe mostrado en la app, no solo en el punto.

## Movimientos pagados con ahorro

Un gasto marcado "pagado con ahorro" (con un fondo concreto o con el ahorro libre consolidado) muestra en su fila de Movimientos una línea adicional en `text-amber-700` debajo de la fecha — "Pagado con [nombre del fondo]" o "Pagado con ahorro libre consolidado" — visualmente distinta de la fecha (gris), para que se note a simple vista sin tener que abrir el movimiento. Un gasto dividido entre ahorro libre en curso y un fondo ("parte pagada con ahorro...") usa el mismo color, por la misma razón.

## Borrar un fondo con saldo

Eliminar un fondo que todavía tiene saldo no hace desaparecer ese dinero: `App.tsx` (`onDeleteFund`) crea antes un movimiento de tipo "retiro" por el saldo restante (fecha de hoy, `fundId` del fondo, nota `"Fondo [nombre] eliminado — saldo devuelto"`) y solo entonces borra el fondo. Como un "retiro" cuenta como ingreso del mes en `computeMonth`, el saldo vuelve al ahorro libre del usuario y queda registrado en el historial. La confirmación de borrado avisa de esto explícitamente ("Se devolverá el saldo de X€ a tu ahorro libre").

## Estructura del proyecto

```
src/
  types/        Modelo de datos de la app (camelCase) y formas de fila de Supabase (snake_case)
  lib/
    calculations.ts   Lógica financiera pura (computeMonth, ahorroLibreHasta, desgloses...)
    format.ts          fmt(), monthKey(), prevMonthKey(), todayISO()
    constants.ts        Categorías por defecto, TYPE_META, meses, etc.
    env.ts               DATA_BACKEND ("local" | "supabase")
    localStore.ts        Persistencia en localStorage (modo local)
    supabaseClient.ts     Cliente Supabase perezoso (modo supabase)
    mappers.ts            Conversión fila (snake_case) <-> modelo de la app (camelCase)
    backup.ts              Exportar/importar backup JSON completo
    tourSteps.ts            Pasos del tour guiado (selector, texto, posición del tooltip, acción)
  hooks/        Un hook por entidad (useTransactions, useFunds, useCategories, useRecurring,
                useRecurringIncome, useAssets, useInvestmentConfig, useVariableBudget,
                useOnboardingStatus) + useAuth
  components/   UI compartida entre pantallas (Chip, StatCard, MonthSwitcher, gráficos, modales,
                LoginScreen, GuidedTour, HelpModal...)
  features/
    movimientos/  fondos/  mensual/  anual/  ajustes/     Una carpeta por pestaña
  App.tsx       Shell: layout, navegación, auth, tour guiado, wiring de hooks y estado compartido

supabase/
  schema.sql    Esquema completo para pegar en el SQL Editor de Supabase

docs/
  ESPECIFICACION-APP-FINANZAS.md   Fuente de verdad del producto
  gestor-finanzas.jsx               Prototipo de referencia original (no se usa en runtime)
```

## PWA

Configurada con `vite-plugin-pwa` (ver `vite.config.ts`): manifest con iconos (192, 512, 512 maskable, apple-touch-icon), `display: standalone`, y precaching básico del app shell vía Workbox para funcionamiento offline. Verificable con `npm run build && npm run preview` (sirve `manifest.webmanifest` y `sw.js`).

Los iconos en `public/pwa-*.png` y `public/apple-touch-icon.png` son **placeholders** (círculo blanco sobre fondo teal, generados por script). Sustitúyelos por un diseño de marca real cuando lo tengas — basta con mantener los mismos nombres de archivo y tamaños.

## Despliegue (Vercel)

La app está desplegada en Vercel, con despliegue automático en cada `git push` a `main`. Para desplegar una copia propia:

1. Sube el proyecto a un repositorio de GitHub.
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio. Vercel detecta Vite automáticamente (`npm run build`, carpeta de salida `dist`).
3. Antes de desplegar, añade las mismas variables del `.env` en Project Settings > Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DATA_BACKEND=supabase`.
4. Deploy. No hace falta ningún `vercel.json`: la app no usa un router de cliente (todo es un estado interno de pestaña), así que no hay rutas que reescribir.

## Estado de la migración

Completado: las 5 pestañas (Movimientos, Fondos, Mensual, Anual, Ajustes), formulario de movimiento, aplicación de preestablecidos, exportar/importar backup, modo local con usuario mock, esquema Supabase, configuración PWA, login/registro con Supabase Auth, tour guiado interactivo + pantalla de ayuda, despliegue en Vercel, y una pasada de optimización responsive específica para móvil (320-414px: safe area insets, legibilidad de textos/importes, teclado virtual). Verificado de extremo a extremo contra un proyecto Supabase real: registro → login → crear movimientos → cerrar sesión → volver a entrar con los datos persistidos, tanto en local como en producción.

Pendiente:

- Diseño de marca definitivo para los iconos PWA (los actuales son placeholders).
- Dominio propio en Vercel (por ahora usa el subdominio `.vercel.app`).
