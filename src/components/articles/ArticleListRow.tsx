import Link from "next/link";
import ArticleImage from "./ArticleImage";
import type { ArticleCardData } from "./ArticleCard";
import { formatArticleDate } from "@/lib/article-helpers";

export default function ArticleListRow({
  article,
  href,
  showCategory = true,
}: {
  article: ArticleCardData;
  href?: string;
  showCategory?: boolean;
}) {
  const date = formatArticleDate(article.publishedAt);

  return (
    <Link
      href={href ?? `/statia/${article.slug}`}
      className="group flex items-start gap-5 py-6 first:pt-0 last:pb-0"
    >
      <div className="min-w-0 flex-1">
        {showCategory && article.category && (
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {article.category.name}
          </span>
        )}
        <h3 className="mt-1.5 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          {date && (
            <>
              <span>{date}</span>
              <span>·</span>
            </>
          )}
          <span>{article.readMinutes} min read</span>
        </div>
      </div>

      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md sm:h-28 sm:w-28">
        <ArticleImage src={article.imageUrl} alt={article.title} sizes="112px" />
      </div>
    </Link>
  );
}
