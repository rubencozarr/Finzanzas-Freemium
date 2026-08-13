import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' en vez de 'autoUpdate': con autoUpdate, el nuevo Service Worker se activaba y tomaba
      // el control en segundo plano sin que la pestaña ya abierta se enterase — el JS de la app seguía
      // siendo el antiguo hasta que el usuario, por su cuenta, recargaba manualmente. En una app que se
      // despliega a menudo, eso significaba que un usuario con la pestaña abierta podía tardar días en
      // recibir un cambio. Con 'prompt', el SW nuevo se queda en estado "waiting" (no hace skipWaiting
      // solo) hasta que App.tsx (vía useRegisterSW de virtual:pwa-register/react) muestra el banner de
      // "Hay una nueva versión disponible" y el usuario pulsa "Actualizar ahora", que fuerza el
      // skipWaiting + recarga. injectRegister: false porque el registro del SW ya lo hace ese hook
      // (con el registro automático de la opción por defecto, se registraría dos veces).
      registerType: 'prompt',
      injectRegister: false,
      // El service worker NUNCA debe activarse en dev: puede servir JS/HTML cacheado y
      // hacer que los cambios de código parezcan no aplicarse aunque recargues la página.
      // El PWA/offline solo se prueba con `npm run build && npm run preview`.
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nitid: Control de Gastos',
        short_name: 'Nitid',
        description: 'Gestor de finanzas personales: ingresos, gastos, fondos de ahorro e inversión.',
        lang: 'es',
        // theme_color/background_color: requisitos exactos del empaquetado TWA para Google Play (antes
        // eran los tonos navy/stone de la propia app; ahora coinciden con lo que exige el TWA, que es
        // lo que Android usa para la splash screen y la barra de estado del "shell" nativo).
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        // Identidad estable de la app para el manifest (distinta de start_url): si start_url cambiara
        // en el futuro (p. ej. añadir un parámetro de tracking), Android seguiría reconociéndola como
        // la MISMA app instalada en vez de ofrecerla como una instalación nueva.
        id: '/',
        // "any" y "maskable" van en entradas SEPARADAS (nunca "any maskable" combinado en una sola):
        // un icono "any" combinado con maskable en Android recorta el propio icono "any" al círculo/
        // forma del sistema, perdiendo el diseño completo en los launchers que no lo tratan como
        // adaptativo.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Sin skipWaiting aquí a propósito (a diferencia de cuando esto era autoUpdate): el SW nuevo debe
        // quedarse "waiting" hasta que el usuario pulse "Actualizar ahora" en el banner — ese click es
        // quien manda el mensaje SKIP_WAITING (lo hace updateServiceWorker() de virtual:pwa-register).
        // clientsClaim sí se mantiene: en cuanto el SW nuevo activa (tras ese click), toma el control
        // inmediatamente sin necesitar una segunda recarga.
        clientsClaim: true,
        // vite-plugin-pwa aplica "navigateFallback: 'index.html'" POR DEFECTO en cuanto no se indique lo
        // contrario (ver defaultWorkbox en su código fuente) — y ese NavigationRoute se registra ANTES
        // que las reglas de runtimeCaching de más abajo, así que sin este `undefined` explícito seguiría
        // ganando siempre a la regla NetworkFirst (comprobado: con solo añadir runtimeCaching, sin este
        // override, el navigateFallback por defecto interceptaba la petición primero y la regla de abajo
        // nunca llegaba a ejecutarse). navigateFallback en sí mismo también era la causa original del
        // bug reportado: sirve SIEMPRE el archivo de fallback desde caché sin intentar red, así que
        // cualquier navegación que no fuera una URL precacheada EXACTA (p. ej. "/blog/cualquier-slug",
        // que no existía cuando el Service Worker anterior se instaló) caía directa a offline.html aunque
        // hubiera conexión perfecta.
        navigateFallback: undefined,
        // En su lugar, esta regla intercepta TODAS las navegaciones (request.mode === 'navigate' cubre
        // "/", "/blog", "/blog/*", "/privacy", "/delete-account" y cualquier ruta futura sin necesidad de
        // listarlas ni mantener una allowlist/denylist) e intenta red primero: si hay conexión, se sirve
        // siempre el HTML más reciente del servidor; si la red no responde en 3s o falla del todo, cae a
        // la última copia de ESA ruta guardada en la caché "pages", y solo si tampoco hay nada guardado
        // (p. ej. la primera visita ya fue sin conexión) se sirve la página de sin-conexión precacheada.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            // Handler manual (en vez de la estrategia "NetworkFirst" + plugin handlerDidError): con la
            // estrategia declarativa, el fallback a offline.html a través de handlerDidError resultó
            // poco fiable en pruebas (a veces no se disparaba y la petición se dejaba sin responder,
            // cayendo al comportamiento por defecto del navegador). Con fetch/catch explícito el control
            // de cada paso es directo y verificable.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handler: async ({ request }: any) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const g = globalThis as any;
              const cache = await g.caches.open('pages');
              try {
                const networkResponse = await fetch(request);
                cache.put(request, networkResponse.clone());
                return networkResponse;
              } catch {
                const cached = await cache.match(request);
                if (cached) return cached;
                // ignoreSearch: true porque Workbox precachea offline.html bajo una URL con
                // "?__WB_REVISION__=<hash>" añadido, no bajo la ruta limpia.
                return g.caches.match('/offline.html', { ignoreSearch: true });
              }
            },
          },
        ],
      },
    }),
  ],
})
