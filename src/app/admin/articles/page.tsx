import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteArticle, publishArticle, unpublishArticle } from "@/lib/actions/articles";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = status === "draft" || status === "published" ? status : undefined;

  const articles = await prisma.article.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

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
        <Link
          href="/admin/articles"
          className={!validStatus ? "font-semibold text-primary" : "text-muted-foreground"}
        >
          Всички
        </Link>
        <Link
          href="/admin/articles?status=draft"
          className={validStatus === "draft" ? "font-semibold text-primary" : "text-muted-foreground"}
        >
          Чернови
        </Link>
        <Link
          href="/admin/articles?status=published"
          className={validStatus === "published" ? "font-semibold text-primary" : "text-muted-foreground"}
        >
          Публикувани
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
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
