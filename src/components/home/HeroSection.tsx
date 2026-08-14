import Link from "next/link";
import Container from "@/components/layout/Container";
import ArticleImage from "@/components/articles/ArticleImage";
import type { ArticleCardData } from "@/components/articles/ArticleCard";

export default function HeroSection({
  lead,
  sideArticles,
}: {
  lead: ArticleCardData;
  sideArticles: ArticleCardData[];
}) {
  return (
    <section className="py-8">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.75fr)]">
          <div className="flex flex-col justify-center">
            {lead.category && (
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {lead.category.name}
              </span>
            )}
            <Link href={`/statia/${lead.slug}`} className="group">
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-4xl">
                {lead.title}
              </h1>
            </Link>
            {lead.excerpt && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{lead.excerpt}</p>
            )}
            <Link
              href={`/statia/${lead.slug}`}
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              Прочети повече →
            </Link>

            <div className="mt-8 flex gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
            </div>
          </div>

          <Link href={`/statia/${lead.slug}`} className="block overflow-hidden rounded-lg">
            <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:h-full">
              <ArticleImage src={lead.imageUrl} alt={lead.title} sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          </Link>

          <div className="flex flex-col divide-y divide-border">
            {sideArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/statia/${article.slug}`}
                className="group flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  {article.category && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {article.category.name}
                    </span>
                  )}
                  <h3 className="mt-1.5 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {article.title}
                  </h3>
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    {article.readMinutes} min read
                  </span>
                </div>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                  <ArticleImage src={article.imageUrl} alt={article.title} sizes="64px" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
