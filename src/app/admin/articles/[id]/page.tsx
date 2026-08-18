import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticleImagePanel from "@/components/admin/ArticleImagePanel";
import ArticleGalleryPanel from "@/components/admin/ArticleGalleryPanel";
import ArticleActionsPanel from "@/components/admin/ArticleActionsPanel";
import ArticlePlacementPanel from "@/components/admin/ArticlePlacementPanel";

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, stockPhotos] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: { category: true, photos: { orderBy: { order: "asc" } } },
    }),
    prisma.stockPhoto.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  if (!article) {
    notFound();
  }

  const paragraphs = article.rewrittenContent.split("\n").filter(Boolean);

  return (
    <div>
      <Link href="/admin/articles" className="text-sm text-muted-foreground hover:text-primary">
        ← Обратно към новини
      </Link>

      <div className="mt-3 flex flex-col gap-6 lg:flex-row">
        <article className="min-w-0 flex-1 rounded-lg border border-border bg-background p-6">
          <span
            className={
              article.status === "published"
                ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
            }
          >
            {article.status === "published" ? "Публикувана" : "Чернова"}
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-2 text-base text-muted-foreground">{article.excerpt}</p>
          )}

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="w-full shrink-0 lg:w-72">
          <ArticleActionsPanel
            article={article}
            secondaryHref={`/admin/articles/${article.id}/edit`}
            secondaryLabel="Редактирай"
          />

          <div className="mt-4">
            <ArticleImagePanel articleId={article.id} imageUrl={article.imageUrl} stockPhotos={stockPhotos} />
          </div>

          <div className="mt-4">
            <ArticlePlacementPanel
              articleId={article.id}
              isHero={article.isHero}
              isFeatured={article.isFeatured}
              isOriginal={article.isOriginal}
            />
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-4 text-sm">
            <h2 className="text-sm font-semibold text-foreground">Детайли</h2>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs text-muted-foreground">Източник</dt>
                <dd className="text-foreground">{article.sourceName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Оригинал</dt>
                <dd className="truncate">
                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {article.originalUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Категория</dt>
                <dd className="text-foreground">{article.category?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">AI генерирана</dt>
                <dd className="text-foreground">{article.aiGenerated ? "Да" : "Не"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Създадена</dt>
                <dd className="text-foreground">{article.createdAt.toLocaleString("bg-BG")}</dd>
              </div>
              {article.publishedAt && (
                <div>
                  <dt className="text-xs text-muted-foreground">Публикувана</dt>
                  <dd className="text-foreground">{article.publishedAt.toLocaleString("bg-BG")}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      <ArticleGalleryPanel articleId={article.id} photos={article.photos} />
    </div>
  );
}
