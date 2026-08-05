import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";

interface BlogShellProps {
  children: ReactNode;
  /** stone-50 en los artículos (para que las tarjetas blancas destaquen sobre el fondo), blanco en el índice. */
  background?: "white" | "stone-50";
  /** Enlace extra "Ver todas las guías" → /blog, junto al de vuelta a la landing. Solo tiene sentido
   * en las páginas de artículo — el índice no necesita enlazarse a sí mismo. */
  showBlogNav?: boolean;
}

// Envoltorio compartido por el índice del blog y cada artículo: logo + enlace de vuelta a la landing,
// ancho de lectura cómodo (720px) y el mismo footer que la landing. El SEO (title/description/og:*) lo
// gestiona cada página por separado con useSeoMeta, porque cada una necesita valores distintos.
export function BlogShell({ children, background = "white", showBlogNav = false }: BlogShellProps) {
  return (
    <div className={`min-h-screen ${background === "stone-50" ? "bg-stone-50" : "bg-white"} text-stone-800 font-sans flex flex-col`}>
      <div className="max-w-[720px] mx-auto px-5 py-8 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700">
            <ArrowLeft size={16} strokeWidth={2} />
            Volver a Nitid
          </a>
          {showBlogNav && (
            <a href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700">
              📚 Ver todas las guías
            </a>
          )}
        </div>
        <main className="mt-8">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
