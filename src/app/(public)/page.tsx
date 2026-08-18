import Container from "@/components/layout/Container";
import HeroSection from "@/components/home/HeroSection";
import MarketWatch from "@/components/home/MarketWatch";
import ArticleGrid from "@/components/home/ArticleGrid";
import OriginalsSection from "@/components/home/OriginalsSection";
import NewsletterBlock from "@/components/home/NewsletterBlock";
import { getLatestPublished } from "@/lib/queries";
import { estimateReadMinutes } from "@/lib/article-helpers";
import type { ArticleCardData } from "@/components/articles/ArticleCard";

export const dynamic = "force-dynamic";

// "From around the world" has no real backing data yet -- there is no
// per-city tagging in the schema, and no international-city articles.
// Placeholder cards until that content exists; each links to "/" rather
// than a fabricated slug.
const WORLD_PLACEHOLDER: (ArticleCardData & { href: string })[] = [
  {
    slug: "london",
    href: "/",
    title: "Луксозни проекти в центъра на града",
    excerpt: null,
    imageUrl: null,
    publishedAt: null,
    category: { name: "London", slug: "london" },
    readMinutes: 4,
  },
  {
    slug: "dubai",
    href: "/",
    title: "Дубай остава магнит за инвеститори",
    excerpt: null,
    imageUrl: null,
    publishedAt: null,
    category: { name: "Dubai", slug: "dubai" },
    readMinutes: 3,
  },
  {
    slug: "new-york",
    href: "/",
    title: "Офис пазарът се възстановява",
    excerpt: null,
    imageUrl: null,
    publishedAt: null,
    category: { name: "New York", slug: "new-york" },
    readMinutes: 4,
  },
  {
    slug: "singapore",
    href: "/",
    title: "Устойчивите сгради — бъдещето е тук",
    excerpt: null,
    imageUrl: null,
    publishedAt: null,
    category: { name: "Singapore", slug: "singapore" },
    readMinutes: 4,
  },
];

export default async function Home() {
  const latest = await getLatestPublished(12);

  if (latest.length === 0) {
    return (
      <Container>
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Все още няма публикувани новини.</p>
        </div>
      </Container>
    );
  }

  const heroIndex = latest.findIndex((article) => article.isHero);
  const lead = heroIndex >= 0 ? latest[heroIndex] : latest[0];
  const rest = latest.filter((article) => article.slug !== lead.slug);

  const featured = rest.filter((article) => article.isFeatured);
  const gridSource = (featured.length > 0 ? featured : rest).slice(0, 4);
  const gridSlugs = new Set(gridSource.map((article) => article.slug));
  const sideSource = rest.filter((article) => !gridSlugs.has(article.slug)).slice(0, 3);

  const toCardData = (article: (typeof latest)[number]): ArticleCardData => ({
    ...article,
    readMinutes: estimateReadMinutes(article.rewrittenContent),
  });

  const leadCard = toCardData(lead);
  const sideArticles = sideSource.map(toCardData);
  const gridArticles = gridSource.map(toCardData);

  return (
    <>
      <HeroSection lead={leadCard} sideArticles={sideArticles} />

      <MarketWatch />

      {gridArticles.length > 0 && (
        <ArticleGrid title="Днес в имотите" viewAllHref="/kategoriya/pazar-na-imoti" articles={gridArticles} />
      )}

      <ArticleGrid
        title="From around the world"
        viewAllHref="/kategoriya/mezhdunarodni-pazari"
        articles={WORLD_PLACEHOLDER}
        showPagination
      />

      <OriginalsSection />

      <NewsletterBlock />
    </>
  );
}
