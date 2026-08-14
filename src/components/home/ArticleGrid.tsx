import Link from "next/link";
import Container from "@/components/layout/Container";
import ArticleCard, { type ArticleCardData } from "@/components/articles/ArticleCard";

type GridArticle = ArticleCardData & { href?: string };

export default function ArticleGrid({
  title,
  viewAllHref,
  articles,
  showPagination = false,
}: {
  title: string;
  viewAllHref: string;
  articles: GridArticle[];
  showPagination?: boolean;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="border-t border-border py-10">
      <Container>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">{title}</h2>
          <Link
            href={viewAllHref}
            className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
          >
            Виж всички →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {articles.slice(0, 4).map((article) => (
            <ArticleCard key={article.slug} article={article} href={article.href} />
          ))}
        </div>

        {showPagination && (
          <div className="mt-6 flex items-center justify-end gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <button
              type="button"
              aria-label="Предишни"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground/60 hover:border-primary hover:text-primary"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Следващи"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground/60 hover:border-primary hover:text-primary"
            >
              ›
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
