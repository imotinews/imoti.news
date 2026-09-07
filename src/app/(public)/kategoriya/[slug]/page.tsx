import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import ArticleListRow from "@/components/articles/ArticleListRow";
import AdSlotContainer from "@/components/ads/AdSlotContainer";
import { prisma } from "@/lib/prisma";
import { getPublishedByCategorySlug } from "@/lib/queries";
import { siteUrl } from "@/lib/newsletter/resend-client";
import { estimateReadMinutes } from "@/lib/article-helpers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) {
    return { title: "Категорията не е намерена" };
  }

  return {
    title: category.name,
    description: `Последни новини в категория ${category.name} — imoti.news.`,
    alternates: { canonical: siteUrl(`/kategoriya/${category.slug}`) },
    openGraph: { title: category.name, type: "website" },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) {
    notFound();
  }

  const articles = await getPublishedByCategorySlug(slug);

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
          <div className="divide-y divide-border">
            {articles.map((article) => (
              <ArticleListRow
                key={article.id}
                article={{ ...article, readMinutes: estimateReadMinutes(article.rewrittenContent) }}
                showCategory={false}
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <AdSlotContainer position="in_article" />
        </div>
      </div>
    </Container>
  );
}
