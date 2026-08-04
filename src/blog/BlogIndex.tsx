import { ARTICLES } from "./articles";
import { BlogShell } from "./BlogShell";
import { useSeoMeta } from "../hooks/useSeoMeta";

export function BlogIndex() {
  useSeoMeta({
    title: "Blog de Nitid — Finanzas personales y control de gastos",
    description: "Artículos sobre control de gastos, ahorro e inversión sin conectar tu banco.",
    image: "https://nitidapp.com/icon-512.png",
    url: "https://nitidapp.com/blog",
  });

  return (
    <BlogShell>
      <h1 className="text-3xl font-bold text-stone-900">Blog</h1>
      <div className="mt-8 flex flex-col gap-4">
        {ARTICLES.map((article) => (
          <a
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="block p-5 rounded-2xl bg-stone-50 border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-bold text-stone-900">{article.title}</h2>
            <p className="mt-2 text-sm text-stone-500">{article.summary}</p>
          </a>
        ))}
      </div>
    </BlogShell>
  );
}
