import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publishArticle, unpublishArticle, updateArticlePlacement } from "@/lib/actions/articles";
import ArticleImagePanel from "@/components/admin/ArticleImagePanel";

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, stockPhotos] = await Promise.all([
    prisma.article.findUnique({ where: { id }, include: { category: true } }),
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
          <div className="rounded-lg border border-border bg-background p-4">
            <h2 className="text-sm font-semibold text-foreground">Действия</h2>

            <div className="mt-3 flex flex-col gap-2">
              {article.status === "published" ? (
                <form
                  action={async () => {
                    "use server";
                    await unpublishArticle(article.id);
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Върни в чернова
                  </button>
                </form>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await publishArticle(article.id);
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
                  >
                    Публикувай сега
                  </button>
                </form>
              )}

              <Link
                href={`/admin/articles/${article.id}/edit`}
                className="w-full rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Редактирай
              </Link>

              {article.status === "published" && (
                <Link
                  href={`/statia/${article.slug}`}
                  target="_blank"
                  className="w-full rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Виж на живо ↗
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4">
            <ArticleImagePanel articleId={article.id} imageUrl={article.imageUrl} stockPhotos={stockPhotos} />
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <h2 className="text-sm font-semibold text-foreground">Начална страница</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Контролира къде се появява статията на началната страница.
            </p>
            <form action={updateArticlePlacement.bind(null, article.id)} className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="isHero" defaultChecked={article.isHero} className="h-4 w-4" />
                Hero (главна статия) — само една активна наведнъж
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={article.isFeatured}
                  className="h-4 w-4"
                />
                Featured (открояваща се)
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="isOriginal"
                  defaultChecked={article.isOriginal}
                  className="h-4 w-4"
                />
                imoti.news Original
              </label>
              <button
                type="submit"
                className="mt-2 w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Запази
              </button>
            </form>
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
    </div>
  );
}
