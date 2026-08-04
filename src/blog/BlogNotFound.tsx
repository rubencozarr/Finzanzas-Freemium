import { BlogShell } from "./BlogShell";
import { useSeoMeta } from "../hooks/useSeoMeta";

export function BlogNotFound() {
  useSeoMeta({
    title: "Artículo no encontrado — Blog de Nitid",
    description: "El artículo que buscas no existe o se ha movido.",
  });

  return (
    <BlogShell>
      <h1 className="text-3xl font-bold text-stone-900">Artículo no encontrado</h1>
      <p className="mt-4 text-stone-500">
        Puede que el enlace sea incorrecto o el artículo se haya movido.{" "}
        <a href="/blog" className="text-teal-600 underline">
          Volver al blog
        </a>
        .
      </p>
    </BlogShell>
  );
}
