import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // El service worker NUNCA debe activarse en dev: puede servir JS/HTML cacheado y
      // hacer que los cambios de código parezcan no aplicarse aunque recargues la página.
      // El PWA/offline solo se prueba con `npm run build && npm run preview`.
      devOptions: { enabled: false },
      includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'],
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
        // "any" y "maskable" van en entradas SEPARADAS (nunca "any maskable" combinado en una sola):
        // un icono "any" combinado con maskable en Android recorta el propio icono "any" al círculo/
        // forma del sistema, perdiendo el diseño completo en los launchers que no lo tratan como
        // adaptativo. icon-maskable-*.png todavía no existen en public/ — siguiente paso.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // favicon.svg pesa ~4.2MB (lleva embebida una variante en PNG para el modo claro/oscuro) y
        // supera el límite de precaché de Workbox (2MiB por defecto). Se sirve igual como favicon
        // normal del navegador, solo se excluye de la caché offline de la PWA.
        globIgnores: ['favicon.svg'],
      },
    }),
  ],
})
