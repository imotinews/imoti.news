import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteSource } from "@/lib/actions/sources";
import { runScraperNow } from "@/lib/actions/scraper";

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ ran?: string; created?: string; irrelevant?: string; duplicates?: string; errors?: string }>;
}) {
  const params = await searchParams;
  const sources = await prisma.source.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Източници</h1>
        <div className="flex gap-3">
          <form action={runScraperNow}>
            <button
              type="submit"
              className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              Изтегли новини сега
            </button>
          </form>
          <Link
            href="/admin/sources/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            + Нов източник
          </Link>
        </div>
      </div>

      {params.ran === "1" && (
        <div className="mt-4 rounded-md border border-border bg-muted p-4 text-sm text-foreground">
          Готово: <strong>{params.created}</strong> нови чернови, {params.irrelevant} нерелевантни
          пропуснати, {params.duplicates} вече видени, {params.errors} грешки.{" "}
          <Link href="/admin/articles?status=draft" className="text-primary hover:underline">
            Виж чернови →
          </Link>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Име</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Активен</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Няма добавени източници.
                </td>
              </tr>
            )}
            {sources.map((source) => (
              <tr key={source.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  {source.name}
                  <div className="text-xs text-muted-foreground">{source.url}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {source.type === "rss" ? "RSS" : "Scrape"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      source.active
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {source.active ? "Да" : "Не"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/sources/${source.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Редактирай
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteSource(source.id);
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
