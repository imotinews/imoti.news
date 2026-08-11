import Link from "next/link";
import type { Article } from "@/lib/mock-articles";
import { getCategoryBySlug } from "@/lib/mock-articles";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticleCard({ article }: { article: Article }) {
  const category = getCategoryBySlug(article.categorySlug);

  return (
    <Link
      href={`/statia/${article.slug}`}
      className="flex flex-col rounded-lg border border-border p-4 transition-colors hover:border-primary"
    >
      {category && (
        <span className="text-xs font-medium text-primary">{category.name}</span>
      )}
      <h3 className="mt-2 text-base font-semibold text-foreground">{article.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
      <span className="mt-3 text-xs text-muted-foreground">
        {formatDate(article.publishedAt)}
      </span>
    </Link>
  );
}
