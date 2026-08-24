import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import AdSlotContainer from "@/components/ads/AdSlotContainer";
import NewsletterForm from "@/components/layout/NewsletterForm";
import ArticleImage from "@/components/articles/ArticleImage";
import { getPublishedBySlug } from "@/lib/queries";
import { siteUrl } from "@/lib/newsletter/resend-client";
import { UNSPLASH_HOME_URL } from "@/lib/images/unsplash";

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBySlug(slug);

  if (!article) {
    return { title: "Новината не е намерена" };
  }

  const description = article.excerpt ?? article.rewrittenContent.slice(0, 160);
  const url = siteUrl(`/statia/${article.slug}`);

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url,
      publishedTime: article.publishedAt?.toISOString(),
      section: article.category?.name,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedBySlug(slug);

  if (!article) {
    notFound();
  }

  const paragraphs = article.rewrittenContent.split("\n").filter(Boolean);
  const firstHalf = paragraphs.slice(0, Math.ceil(paragraphs.length / 2));
  const secondHalf = paragraphs.slice(Math.ceil(paragraphs.length / 2));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt ?? undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    articleSection: article.category?.name,
    mainEntityOfPage: siteUrl(`/statia/${article.slug}`),
    publisher: {
      "@type": "Organization",
      name: "imoti.news",
    },
    isBasedOn: article.originalUrl,
  };

  return (
    <Container>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0">
          {article.category && (
            <Link
              href={`/kategoriya/${article.category.slug}`}
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {article.category.name}
            </Link>
          )}

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {article.title}
          </h1>

          <p className="mt-3 text-xs text-muted-foreground">
            {formatDate(article.publishedAt)}
          </p>

          {article.imageUrl && (
            <div className="mt-5">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
                <ArticleImage src={article.imageUrl} alt={article.title} sizes="(min-width: 1024px) 66vw, 100vw" />
              </div>
              {article.imageAttributionName && article.imageAttributionUrl && (
                <p className="mt-1.5 text-right text-[11px] text-muted-foreground">
                  Photo by{" "}
                  <a
                    href={article.imageAttributionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {article.imageAttributionName}
                  </a>{" "}
                  on{" "}
                  <a href={UNSPLASH_HOME_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Unsplash
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-4 text-base leading-7 text-foreground">
            {firstHalf.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {secondHalf.length > 0 && (
            <>
              <div className="my-8">
                <AdSlotContainer position="in_article" />
              </div>
              <div className="my-8 rounded-lg border border-border bg-muted p-5">
                <p className="text-sm font-semibold text-foreground">
                  Абонирай се за бюлетина на imoti.news
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Топ новините за имоти всяка седмица в твоята пощенска кутия.
                </p>
                <div className="mt-3">
                  <NewsletterForm />
                </div>
              </div>
              <div className="space-y-4 text-base leading-7 text-foreground">
                {secondHalf.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </>
          )}

          {article.photos.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Галерия
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {article.photos.map((photo) => (
                  <figure key={photo.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption ?? article.title}
                      className="aspect-[4/3] w-full rounded-md object-cover"
                    />
                    {photo.caption && (
                      <figcaption className="mt-1 text-xs text-muted-foreground">
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            Източник: {article.sourceName} —{" "}
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-medium text-primary hover:underline break-all"
            >
              {article.originalUrl}
            </a>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <AdSlotContainer position="sidebar" />
          </div>
        </aside>
      </div>
    </Container>
  );
}
