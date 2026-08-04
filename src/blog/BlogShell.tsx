import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";

interface BlogShellProps {
  children: ReactNode;
  /** stone-50 en los artículos (para que las tarjetas blancas destaquen sobre el fondo), blanco en el índice. */
  background?: "white" | "stone-50";
}

// Envoltorio compartido por el índice del blog y cada artículo: logo + enlace de vuelta a la landing,
// ancho de lectura cómodo (720px) y el mismo footer que la landing. El SEO (title/description/og:*) lo
// gestiona cada página por separado con useSeoMeta, porque cada una necesita valores distintos.
export function BlogShell({ children, background = "white" }: BlogShellProps) {
  return (
    <div className={`min-h-screen ${background === "stone-50" ? "bg-stone-50" : "bg-white"} text-stone-800 font-sans flex flex-col`}>
      <div className="max-w-[720px] mx-auto px-5 py-8 w-full flex-1">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700">
          <ArrowLeft size={16} strokeWidth={2} />
          Volver a Nitid
        </a>
        <main className="mt-8">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
