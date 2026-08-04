import type { BlogArticle } from "./articles";
import { BlogShell } from "./BlogShell";
import { useSeoMeta } from "../hooks/useSeoMeta";

export function BlogPost({ article }: { article: BlogArticle }) {
  useSeoMeta({
    title: article.metaTitle,
    description: article.metaDescription,
    image: "https://nitidapp.com/icon-512.png",
    url: `https://nitidapp.com/blog/${article.slug}`,
  });

  return (
    <BlogShell>
      <article.Component />
    </BlogShell>
  );
}
