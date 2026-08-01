import { LEMONSQUEEZY_CHECKOUT_UUID, LEMONSQUEEZY_STORE_SLUG } from "./constants";

// lemon.js (cargado en index.html) engancha window.createLemonSqueezy, que a su vez expone
// window.LemonSqueezy con los helpers del overlay de checkout.
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: { Open: (url: string) => void; Close: () => void };
      Setup: (options: { eventHandler: (event: { event: string; data?: unknown }) => void }) => void;
    };
  }
}

let loaded = false;
// Se sobrescribe en cada openCheckout: solo puede haber un overlay abierto a la vez, así que no hace
// falta una cola de callbacks.
let onSuccess: (() => void) | null = null;

// Idempotente: React 19 en dev (Strict Mode) puede invocar dos veces el mismo efecto, y no hace
// falta re-enganchar los listeners del overlay si ya está listo.
function ensureLoaded() {
  if (loaded || !window.createLemonSqueezy) return;
  window.createLemonSqueezy();
  // El botón de cerrar (X) que pinta el propio overlay de Lemon Squeezy queda por debajo de la
  // status bar/notch en la PWA instalada (fuera del safe-area, inaccesible al tacto) y no hay ningún
  // parámetro de checkout documentado para reposicionarlo. En vez de depender de ese botón, cerramos
  // el overlay nosotros mismos en cuanto el pago se completa (evento "Checkout.Success" de lemon.js).
  window.LemonSqueezy?.Setup({
    eventHandler: (event) => {
      if (event.event === "Checkout.Success") {
        window.LemonSqueezy?.Url.Close();
        onSuccess?.();
      }
    },
  });
  loaded = true;
}

// El TWA empaquetado para Play Store renderiza la PWA igual que una instalada normal (display-mode:
// standalone), así que esa señal sola no distingue "TWA de Play Store" de "PWA añadida a la pantalla
// de inicio desde el propio navegador". document.referrer sí lo hace: Chrome lo pone a
// "android-app://<paquete>" únicamente cuando la página se abre dentro de una Trusted Web Activity.
function isRunningAsTWA(): boolean {
  if (document.referrer.startsWith("android-app://")) return true;
  return typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
}

/** Abre el checkout de Lemon Squeezy (mensual/anual se eligen dentro de esa misma página), con el
 * user_id como custom data (así el webhook sabe a qué usuario activar) y el email prellenado si se
 * conoce. onSuccess se llama justo después de cerrar el overlay al completarse el pago (no espera a la
 * confirmación del webhook, que llega por separado y puede tardar unos segundos).
 *
 * Dentro del TWA de Play Store el cobro tiene que salir del "shell" de la app y completarse en el
 * navegador del sistema, no en el overlay de lemon.js (que dentro de un TWA se vería como parte de la
 * propia app nativa) — es lo que exige la política de pagos de Google Play para compras que no pasan
 * por Play Billing. En ese caso no hay overlay ni evento "Checkout.Success" que escuchar, así que
 * onCheckoutSuccess no se invoca en esta rama: la suscripción se activa igual vía el webhook, y la app
 * la recoge la próxima vez que consulte el estado (p. ej. al volver a abrirla). */
export function openCheckout(userId: string, email?: string, onCheckoutSuccess?: () => void) {
  const params = new URLSearchParams();
  params.set("checkout[custom][user_id]", userId);
  if (email) params.set("checkout[email]", email);
  const url = `https://${LEMONSQUEEZY_STORE_SLUG}.lemonsqueezy.com/checkout/buy/${LEMONSQUEEZY_CHECKOUT_UUID}?${params.toString()}`;

  if (isRunningAsTWA()) {
    window.open(url, "_blank");
    return;
  }

  ensureLoaded();
  onSuccess = onCheckoutSuccess ?? null;
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Url.Open(url);
  } else {
    // lemon.js todavía no ha cargado (script defer, ejecución muy temprana): fallback a navegación
    // directa en vez de que el botón no haga nada.
    window.open(url, "_blank");
  }
}
