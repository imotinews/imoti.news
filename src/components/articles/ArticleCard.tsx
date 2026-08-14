import Link from "next/link";
import ArticleImage from "./ArticleImage";

export type ArticleCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
  readMinutes: number;
};

export default function ArticleCard({
  article,
  href,
}: {
  article: ArticleCardData;
  href?: string;
}) {
  return (
    <Link href={href ?? `/statia/${article.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          className="transition-opacity group-hover:opacity-80"
        />
      </div>

      {article.category && (
        <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">
          {article.category.name}
        </span>
      )}
      <h3 className="mt-1.5 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
        {article.title}
      </h3>
      <span className="mt-2 text-xs text-muted-foreground">{article.readMinutes} min read</span>
    </Link>
  );
}
