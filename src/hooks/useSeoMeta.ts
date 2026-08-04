import { useEffect } from "react";

interface SeoMetaOptions {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

// Páginas públicas sin servidor de render (landing, artículos del blog) montan y desmontan sobre la
// misma index.html genérica — mientras estén montadas sustituyen el <title>/<meta description> y
// añaden las etiquetas og:* específicas de esa página, y las restauran al desmontar para no dejar
// tags "filtrados" en cuanto se navega a otra parte de la app.
export function useSeoMeta({ title, description, image, url }: SeoMetaOptions) {
  useEffect(() => {
    const originalTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const originalDescription = descriptionTag?.getAttribute("content") ?? null;

    document.title = title;
    descriptionTag?.setAttribute("content", description);

    const ogEntries: Array<[string, string]> = [
      ["og:title", title],
      ["og:description", description],
    ];
    if (image) ogEntries.push(["og:image", image]);
    if (url) ogEntries.push(["og:url", url]);

    const createdTags = ogEntries.map(([property, content]) => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      meta.setAttribute("content", content);
      document.head.appendChild(meta);
      return meta;
    });

    return () => {
      document.title = originalTitle;
      if (originalDescription !== null) descriptionTag?.setAttribute("content", originalDescription);
      createdTags.forEach((tag) => tag.remove());
    };
  }, [title, description, image, url]);
}
