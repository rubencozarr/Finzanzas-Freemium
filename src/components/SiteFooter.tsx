export function SiteFooter() {
  return (
    <footer className="bg-stone-800 text-stone-400 px-5 py-8 text-sm">
      <div className="max-w-[1024px] mx-auto flex flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          <a href="/privacy" className="hover:text-white">
            Política de privacidad
          </a>
          <span className="text-stone-600">·</span>
          <a href="/delete-account" className="hover:text-white">
            Eliminar cuenta
          </a>
          <span className="text-stone-600">·</span>
          <a href="mailto:contacto@nitidapp.com" className="hover:text-white">
            contacto@nitidapp.com
          </a>
        </div>
        <p className="text-stone-500">© 2026 Nitid Apps</p>
      </div>
    </footer>
  );
}
