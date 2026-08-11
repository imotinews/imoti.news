import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import ArticleCard from "@/components/articles/ArticleCard";
import AdSlot from "@/components/ads/AdSlot";
import { CATEGORIES } from "@/lib/categories";
import { getArticlesByCategory, getCategoryBySlug } from "@/lib/mock-articles";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const articles = getArticlesByCategory(slug);

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {articles.length} {articles.length === 1 ? "новина" : "новини"}
        </p>
      </div>

      <div className="border-t border-border py-8">
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Все още няма новини в тази категория.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <AdSlot position="in_article" />
        </div>
      </div>
    </Container>
  );
}
