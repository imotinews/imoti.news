import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteArticle, publishArticle, unpublishArticle } from "@/lib/actions/articles";
import ArticleFilters from "@/components/admin/ArticleFilters";

// Sentinel for "articles with no category at all" in the ?category= filter.
const NO_CATEGORY = "none";

function listHref(params: { status?: string; category?: string; source?: string }) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.category) qs.set("category", params.category);
  if (params.source) qs.set("source", params.source);
  const str = qs.toString();
  return str ? `/admin/articles?${str}` : "/admin/articles";
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; source?: string }>;
}) {
  const { status, category, source } = await searchParams;
  const validStatus = status === "draft" || status === "published" ? status : undefined;

  const [articles, categories, categoryCounts, sourceCounts] = await Promise.all([
    prisma.article.findMany({
      where: {
        ...(validStatus ? { status: validStatus } : {}),
        ...(category === NO_CATEGORY
          ? { categoryId: null }
          : category
            ? { category: { slug: category } }
            : {}),
        ...(source ? { sourceName: source } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    // Counts follow the status tab only (not the other filters), so each
    // dropdown entry shows how many articles picking it would give.
    prisma.article.groupBy({
      by: ["categoryId"],
      where: validStatus ? { status: validStatus } : undefined,
      _count: { _all: true },
    }),
    prisma.article.groupBy({
      by: ["sourceName"],
      where: validStatus ? { status: validStatus } : undefined,
      _count: { _all: true },
      orderBy: { sourceName: "asc" },
    }),
  ]);

  const countByCategoryId = new Map(categoryCounts.map((c) => [c.categoryId, c._count._all]));
  const categoryOptions = [
    ...categories.map((c) => ({
      value: c.slug,
      label: `${c.name} (${countByCategoryId.get(c.id) ?? 0})`,
    })),
    { value: NO_CATEGORY, label: `Без категория (${countByCategoryId.get(null) ?? 0})` },
  ];
  const sourceOptions = sourceCounts.map((s) => ({
    value: s.sourceName,
    label: `${s.sourceName} (${s._count._all})`,
  }));

  const tabClass = (active: boolean) => (active ? "font-semibold text-primary" : "text-muted-foreground");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Новини</h1>
        <Link
          href="/admin/articles/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          + Нова новина
        </Link>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        <Link href={listHref({ category, source })} className={tabClass(!validStatus)}>
          Всички
        </Link>
        <Link href={listHref({ status: "draft", category, source })} className={tabClass(validStatus === "draft")}>
          Чернови
        </Link>
        <Link
          href={listHref({ status: "published", category, source })}
          className={tabClass(validStatus === "published")}
        >
          Публикувани
        </Link>
      </div>

      <ArticleFilters
        status={validStatus}
        category={category}
        source={source}
        categoryOptions={categoryOptions}
        sourceOptions={sourceOptions}
      />

      <p className="mt-3 text-xs text-muted-foreground">Показани: {articles.length}</p>

      <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Заглавие</th>
              <th className="px-4 py-3 font-medium">Източник</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Създадена</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Няма новини.
                </td>
              </tr>
            )}
            {articles.map((article) => (
              <tr key={article.id} className="border-b border-border last:border-0">
                <td className="max-w-xs px-4 py-3 text-foreground">
                  <Link href={`/admin/articles/${article.id}`} className="hover:text-primary hover:underline">
                    {article.title}
                  </Link>
                  {article.excerpt && (
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {article.excerpt}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {article.sourceName}
                  {article.aiGenerated && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">AI</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {article.category?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      article.status === "published"
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {article.status === "published" ? "Публикувана" : "Чернова"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                  {article.createdAt.toLocaleString("bg-BG", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {article.status === "published" ? (
                      <form
                        action={async () => {
                          "use server";
                          await unpublishArticle(article.id);
                        }}
                      >
                        <button type="submit" className="text-muted-foreground hover:underline">
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
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90"
                        >
                          Публикувай
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Редактирай
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteArticle(article.id);
                      }}
                    >
                      <button type="submit" className="text-red-600 hover:underline">
                        Изтрий
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
