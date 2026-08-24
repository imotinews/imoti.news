import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteSource } from "@/lib/actions/sources";
import { runScraperNow } from "@/lib/actions/scraper";
import ScrapeButton from "@/components/admin/ScrapeButton";
import ScrapeProgressPanel from "@/components/admin/ScrapeProgressPanel";

const STATS_WINDOW_DAYS = 3;

const STATUS_LABEL: Record<string, string> = {
  created: "нова статия",
  irrelevant: "нерелевантно",
  similar_duplicate: "прилича на друга",
  too_old: "твърде стара",
  error: "грешка",
};

const STATUS_CLASS: Record<string, string> = {
  created: "bg-primary/10 text-primary",
  irrelevant: "bg-muted text-muted-foreground",
  similar_duplicate: "bg-muted text-muted-foreground",
  too_old: "bg-muted text-muted-foreground",
  error: "bg-red-100 text-red-700",
};

export default async function AdminSourcesPage() {
  const [sources, latestRun] = await Promise.all([
    prisma.source.findMany({ orderBy: { name: "asc" } }),
    prisma.scrapeRun.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);

  const windowStart = new Date(Date.now() - STATS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const sourceIds = sources.map((s) => s.id);

  const [statCounts, lastAttempts] = await Promise.all([
    prisma.scrapedUrl.groupBy({
      by: ["sourceId", "status"],
      where: { sourceId: { in: sourceIds }, createdAt: { gte: windowStart } },
      _count: true,
    }),
    prisma.scrapedUrl.findMany({
      where: { sourceId: { in: sourceIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["sourceId"],
      select: { sourceId: true, createdAt: true, status: true, errorMessage: true },
    }),
  ]);

  const statsBySource = new Map<string, Record<string, number>>();
  for (const row of statCounts) {
    if (!row.sourceId) continue;
    const current = statsBySource.get(row.sourceId) ?? {};
    current[row.status] = row._count;
    statsBySource.set(row.sourceId, current);
  }

  const lastAttemptBySource = new Map(lastAttempts.map((a) => [a.sourceId, a]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Източници</h1>
        <div className="flex gap-3">
          <form action={runScraperNow}>
            <ScrapeButton />
          </form>
          <Link
            href="/admin/sources/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            + Нов източник
          </Link>
        </div>
      </div>

      <ScrapeProgressPanel initialRun={latestRun} />

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Име</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Последна проверка</th>
              <th className="px-4 py-3 font-medium">Активен</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Няма добавени източници.
                </td>
              </tr>
            )}
            {sources.map((source) => {
              const lastAttempt = lastAttemptBySource.get(source.id);
              const stats = statsBySource.get(source.id) ?? {};

              return (
              <tr key={source.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  {source.name}
                  <div className="text-xs text-muted-foreground">{source.url}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {source.type === "rss" ? "RSS" : "Scrape"}
                  {source.contentType === "lifestyle" && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">lifestyle</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {source.lastCheckedAt ? (
                    <div>
                      <div className="text-xs text-foreground">
                        {source.lastCheckedAt.toLocaleString("bg-BG")}
                      </div>
                      {lastAttempt && (
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[lastAttempt.status] ?? "bg-muted text-muted-foreground"}`}
                          title={lastAttempt.errorMessage ?? undefined}
                        >
                          {STATUS_LABEL[lastAttempt.status] ?? lastAttempt.status}
                        </span>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        последни {STATS_WINDOW_DAYS} дни: {stats.created ?? 0} нови, {stats.error ?? 0} грешки,{" "}
                        {stats.too_old ?? 0} стари
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Няма проверки още</span>
                  )}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
