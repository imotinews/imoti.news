import Container from "@/components/layout/Container";
import HeroSection from "@/components/home/HeroSection";
import MarketWatch from "@/components/home/MarketWatch";
import ArticleGrid from "@/components/home/ArticleGrid";
import OriginalsSection from "@/components/home/OriginalsSection";
import NewsletterBlock from "@/components/home/NewsletterBlock";
import { getLatestPublished, getPublishedByCategorySlug } from "@/lib/queries";
import { estimateReadMinutes } from "@/lib/article-helpers";
import type { ArticleCardData } from "@/components/articles/ArticleCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [latest, worldArticles] = await Promise.all([
    getLatestPublished(12),
    getPublishedByCategorySlug("mezhdunarodni-pazari"),
  ]);

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
  const worldCards = worldArticles.slice(0, 8).map(toCardData);

  return (
    <>
      <HeroSection lead={leadCard} sideArticles={sideArticles} />

      <MarketWatch />

      {gridArticles.length > 0 && (
        <ArticleGrid title="Днес в имотите" viewAllHref="/kategoriya/pazar-na-imoti" articles={gridArticles} />
      )}

      {worldCards.length > 0 && (
        <ArticleGrid
          title="From around the world"
          viewAllHref="/kategoriya/mezhdunarodni-pazari"
          articles={worldCards}
          showPagination
        />
      )}

      <OriginalsSection />

      <NewsletterBlock />
    </>
  );
}
