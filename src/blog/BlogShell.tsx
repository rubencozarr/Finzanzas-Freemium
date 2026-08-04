import type { ReactNode } from "react";
import { SiteFooter } from "../components/SiteFooter";

// Envoltorio compartido por el índice del blog y cada artículo: logo + enlace de vuelta a la landing,
// ancho de lectura cómodo (720px) y el mismo footer que la landing. El SEO (title/description/og:*) lo
// gestiona cada página por separado con useSeoMeta, porque cada una necesita valores distintos.
export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-stone-800 font-sans flex flex-col">
      <div className="max-w-[720px] mx-auto px-5 py-8 w-full flex-1">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700">
          <img src="/icon-512.png" alt="Nitid" width={24} height={24} className="rounded-md" />
          ← Volver a Nitid
        </a>
        <main className="mt-8">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
