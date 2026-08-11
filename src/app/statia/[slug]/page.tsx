import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import AdSlot from "@/components/ads/AdSlot";
import { MOCK_ARTICLES, getArticleBySlug, getCategoryBySlug } from "@/lib/mock-articles";

export function generateStaticParams() {
  return MOCK_ARTICLES.map((article) => ({ slug: article.slug }));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("bg-BG", {
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
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const category = getCategoryBySlug(article.categorySlug);
  const [firstHalf, secondHalf] = [
    article.content.slice(0, Math.ceil(article.content.length / 2)),
    article.content.slice(Math.ceil(article.content.length / 2)),
  ];

  return (
    <Container>
      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0">
          {category && (
            <Link
              href={`/kategoriya/${category.slug}`}
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {category.name}
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
                <AdSlot position="in_article" />
              </div>
              <div className="space-y-4 text-base leading-7 text-foreground">
                {secondHalf.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            Източник:{" "}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-medium text-primary hover:underline"
            >
              {article.sourceName}
            </a>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <AdSlot position="sidebar" />
          </div>
        </aside>
      </div>
    </Container>
  );
}
