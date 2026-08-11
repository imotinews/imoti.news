import Link from "next/link";
import Container from "@/components/layout/Container";
import ArticleCard from "@/components/articles/ArticleCard";
import AdSlot from "@/components/ads/AdSlot";
import { getLatestArticles, getCategoryBySlug } from "@/lib/mock-articles";

export default function Home() {
  const latest = getLatestArticles();
  const [lead, ...rest] = latest;
  const leadCategory = getCategoryBySlug(lead.categorySlug);

  return (
    <Container>
      <div className="py-8">
        {leadCategory && (
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {leadCategory.name}
          </span>
        )}
        <Link href={`/statia/${lead.slug}`} className="group block">
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-4xl">
            {lead.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">{lead.excerpt}</p>
        </Link>
      </div>

      <div className="border-t border-border py-8">
        <h2 className="text-lg font-semibold text-foreground">Последни новини</h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, 3).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        <div className="my-8">
          <AdSlot position="in_article" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(3).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </Container>
  );
}
