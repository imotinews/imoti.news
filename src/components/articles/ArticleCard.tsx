import Link from "next/link";

export type ArticleCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
};

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <Link
      href={`/statia/${article.slug}`}
      className="flex flex-col rounded-lg border border-border p-4 transition-colors hover:border-primary"
    >
      {article.category && (
        <span className="text-xs font-medium text-primary">{article.category.name}</span>
      )}
      <h3 className="mt-2 text-base font-semibold text-foreground">{article.title}</h3>
      {article.excerpt && (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
      )}
      <span className="mt-3 text-xs text-muted-foreground">
        {formatDate(article.publishedAt)}
      </span>
    </Link>
  );
}
