import { ARTICLES, type BlogArticle } from "./articles";
import { BlogShell } from "./BlogShell";
import { useSeoMeta } from "../hooks/useSeoMeta";

export function BlogPost({ article }: { article: BlogArticle }) {
  useSeoMeta({
    title: article.metaTitle,
    description: article.metaDescription,
    image: "https://nitidapp.com/icon-512.png",
    url: `https://nitidapp.com/blog/${article.slug}`,
  });

  // Cíclico (1→2→3→4→1): el orden lógico de ARTICLES en articles.ts es la única fuente de verdad,
  // así que reordenar ese array reordena también a qué apunta "Sigue leyendo" en cada artículo.
  const currentIndex = ARTICLES.findIndex((a) => a.slug === article.slug);
  const nextArticle = ARTICLES[(currentIndex + 1) % ARTICLES.length];

  return (
    <BlogShell background="stone-50" showBlogNav>
      <article.Component />

      <div className="mt-12 pt-8 border-t border-stone-200">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Sigue leyendo</p>
        <a
          href={`/blog/${nextArticle.slug}`}
          className="block p-5 rounded-xl bg-stone-50 border border-stone-200 hover:shadow-sm transition-shadow"
        >
          <h3 className="font-bold text-stone-900">{nextArticle.title}</h3>
          <p className="mt-1.5 text-sm text-stone-500">{nextArticle.summary}</p>
          <span className="mt-2 inline-block text-sm font-medium text-teal-600">Leer artículo →</span>
        </a>
      </div>
    </BlogShell>
  );
}
