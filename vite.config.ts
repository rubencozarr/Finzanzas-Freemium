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
        name: 'Klaro',
        short_name: 'Klaro',
        description: 'Gestor de finanzas personales: ingresos, gastos, fondos de ahorro e inversión.',
        lang: 'es',
        theme_color: '#1e293b',
        background_color: '#fafaf9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
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
