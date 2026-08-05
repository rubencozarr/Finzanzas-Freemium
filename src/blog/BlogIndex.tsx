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
      <div className="rounded-2xl bg-teal-600 text-white px-6 py-10 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Blog de Nitid</h1>
        <p className="mt-3 text-teal-50 text-sm sm:text-base leading-relaxed">
          Guías prácticas para tomar el control de tus finanzas personales.
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-stone-600 leading-relaxed">
        4 guías ordenadas para ir de cero a tener el control de tu dinero. Empieza por la primera o lee la que más te interese.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ARTICLES.map((article, i) => (
          <a
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="flex flex-col p-6 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-50 text-teal-600 font-bold text-lg">{i + 1}</span>
            <h2 className="mt-3 text-lg font-bold text-stone-900">{article.title}</h2>
            <p className="mt-2 text-sm text-stone-500 flex-1">{article.summary}</p>
            <span className="mt-3 text-sm font-medium text-teal-600">Leer artículo →</span>
          </a>
        ))}
      </div>
    </BlogShell>
  );
}
