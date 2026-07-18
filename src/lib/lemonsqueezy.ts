import { LEMONSQUEEZY_CHECKOUT_UUID, LEMONSQUEEZY_STORE_SLUG } from "./constants";

// lemon.js (cargado en index.html) engancha window.createLemonSqueezy, que a su vez expone
// window.LemonSqueezy con el helper del overlay de checkout.
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: { Url: { Open: (url: string) => void } };
  }
}

let loaded = false;

// Idempotente: React 19 en dev (Strict Mode) puede invocar dos veces el mismo efecto, y no hace
// falta re-enganchar los listeners del overlay si ya está listo.
function ensureLoaded() {
  if (loaded || !window.createLemonSqueezy) return;
  window.createLemonSqueezy();
  loaded = true;
}

/** Abre el overlay de checkout de Lemon Squeezy (mensual/anual se eligen dentro de esa misma
 * página), con el user_id como custom data (así el webhook sabe a qué usuario activar) y el email
 * prellenado si se conoce. */
export function openCheckout(userId: string, email?: string) {
  ensureLoaded();
  const params = new URLSearchParams();
  params.set("checkout[custom][user_id]", userId);
  if (email) params.set("checkout[email]", email);
  const url = `https://${LEMONSQUEEZY_STORE_SLUG}.lemonsqueezy.com/checkout/buy/${LEMONSQUEEZY_CHECKOUT_UUID}?${params.toString()}`;
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Url.Open(url);
  } else {
    // lemon.js todavía no ha cargado (script defer, ejecución muy temprana): fallback a navegación
    // directa en vez de que el botón no haga nada.
    window.open(url, "_blank");
  }
}
