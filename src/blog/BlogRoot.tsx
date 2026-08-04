import { ARTICLES } from "./articles";
import { BlogIndex } from "./BlogIndex";
import { BlogPost } from "./BlogPost";
import { BlogNotFound } from "./BlogNotFound";

// Enrutador manual mínimo: el blog es contenido público sin la lógica de sesión/TWA del resto de la
// app (ver main.tsx), así que no merece la pena traer una librería de rutas para dos vistas. Navegar
// entre /blog y /blog/:slug se hace con <a> normales (recarga completa) — trade-off aceptable para
// páginas de contenido que apenas comparten estado con el resto de la SPA.
export function BlogRoot({ path }: { path: string }) {
  const trimmed = path.replace(/\/+$/, "");
  if (trimmed === "" || trimmed === "/blog") {
    return <BlogIndex />;
  }
  const slug = trimmed.replace(/^\/blog\//, "");
  const article = ARTICLES.find((a) => a.slug === slug);
  return article ? <BlogPost article={article} /> : <BlogNotFound />;
}
