// El TWA empaquetado para Play Store renderiza la PWA igual que una instalada normal (display-mode:
// standalone), así que esa señal sola no distingue "TWA de Play Store" de "PWA añadida a la pantalla
// de inicio desde el propio navegador". document.referrer sí lo hace: Chrome lo pone a
// "android-app://<paquete>" únicamente cuando la página se abre dentro de una Trusted Web Activity.
export function isRunningAsTWA(): boolean {
  if (document.referrer.startsWith("android-app://")) return true;
  return typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
}
