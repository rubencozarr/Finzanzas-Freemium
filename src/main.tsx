import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isLocalBackend } from './lib/env'

const pathname = window.location.pathname
const isBlogRoute = pathname === '/blog' || pathname.startsWith('/blog/')

if (isBlogRoute) {
  // El blog es contenido público y estático: no necesita red (a diferencia del resto de la app en modo
  // Supabase) ni pasa por el check de "offline" de más abajo.
  // Import dinámico (no estático arriba del archivo): /blog y el resto de la SPA (login/landing/app
  // autenticada) son rutas mutuamente excluyentes que ya se deciden aquí mismo, de forma síncrona, antes
  // de montar nada — sin esto, los 4 artículos del blog y sus componentes de contenido (~90 KB) viajaban
  // en el mismo bundle que carga cualquier visita autenticada, que nunca llega a montar el blog.
  import('./blog/BlogRoot.tsx').then(({ BlogRoot }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <BlogRoot path={pathname} />
      </StrictMode>,
    )
  })
} else {
  // En modo Supabase la app necesita red para todo (login, leer/guardar datos, incluso aceptar la
  // política de privacidad al entrar) — sin este check, cargarla sin conexión dejaba ver pantallas
  // interactivas (login, modal de política de privacidad...) que fallaban al primer intento de red con
  // errores poco claros ("no se pudo guardar"), en vez de dejar claro desde el principio que hace falta
  // conexión. En modo local no aplica: funciona 100% sin red por diseño. offline.html está precacheado
  // por el service worker, así que esta redirección funciona igual sin conexión.
  const goOffline = () => window.location.replace('/offline.html')

  const offlineAtLoad = !isLocalBackend && !navigator.onLine
  if (offlineAtLoad) {
    goOffline()
  } else {
    // Si la conexión se pierde con la app ya cargada (no solo al entrar), se manda a la misma pantalla
    // en vez de dejar que el usuario siga interactuando con formularios que van a fallar a mitad de uso.
    if (!isLocalBackend) {
      window.addEventListener('offline', goOffline)
    }
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
}
