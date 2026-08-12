import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import AdSlotContainer from "@/components/ads/AdSlotContainer";
import NewsletterForm from "@/components/layout/NewsletterForm";
import { getPublishedBySlug } from "@/lib/queries";

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

  return (
    <Container>
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
