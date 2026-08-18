import { getAnalyticsSummary, isAnalyticsConfigured } from "@/lib/analytics/ga4-client";
import { prisma } from "@/lib/prisma";

const GA_PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

function gaLink(path: string): string {
  return GA_PROPERTY_ID
    ? `https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID}${path}`
    : "https://analytics.google.com";
}

function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(6, 8)}.${yyyymmdd.slice(4, 6)}`;
}

const CHANNEL_LABELS: Record<string, string> = {
  "Organic Search": "Органично търсене",
  Direct: "Директен трафик",
  Referral: "Препратка от друг сайт",
  "Organic Social": "Социални мрежи",
  Email: "Имейл",
  Unassigned: "Неопределено",
};

function Sparkline({ points }: { points: { date: string; views: number }[] }) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.views);
  const max = Math.max(...values, 1);
  const width = 560;
  const height = 60;

  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - (p.views / max) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
      <polyline points={coords} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
    </svg>
  );
}

export default async function AdminStatisticsPage() {
  if (!isAnalyticsConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Статистика</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Google Analytics все още не е свързан с админ панела — липсват credentials за GA4 Data
          API. Дай ми service account ключ (client email + private key) и property ID, за да го
          включим.
        </p>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Отвори Google Analytics директно ↗
        </a>
      </div>
    );
  }

  const summary = await getAnalyticsSummary(30);

  if (!summary) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Статистика</h1>
        <p className="mt-4 text-sm text-red-600">
          Не успях да заредя данни от Google Analytics — провери credentials-ите.
        </p>
      </div>
    );
  }

  const articleSlugs = summary.topPages
    .map((p) => p.path.match(/^\/statia\/([^/?]+)/)?.[1])
    .filter((s): s is string => Boolean(s));

  const articles =
    articleSlugs.length > 0
      ? await prisma.article.findMany({
          where: { slug: { in: articleSlugs } },
          select: { slug: true, title: true },
        })
      : [];
  const titleBySlug = new Map(articles.map((a) => [a.slug, a.title]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Статистика <span className="text-base font-normal text-muted-foreground">(последните 30 дни)</span>
        </h1>
        <div className="flex gap-4 text-sm">
          <a
            href={gaLink("/realtime/overview")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Реално време в GA4 ↗
          </a>
          <a
            href={gaLink("")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Пълна статистика в GA4 ↗
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Посетители</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {summary.totalUsers.toLocaleString("bg-BG")}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Прегледи на страници</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {summary.totalPageViews.toLocaleString("bg-BG")}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        <p className="text-sm font-semibold text-foreground">Прегледи по дни</p>
        <div className="mt-3">
          <Sparkline points={summary.dailyViews} />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{summary.dailyViews[0] ? formatDate(summary.dailyViews[0].date) : ""}</span>
            <span>
              {summary.dailyViews.length > 0
                ? formatDate(summary.dailyViews[summary.dailyViews.length - 1].date)
                : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">Топ 5 статии</p>
          <ul className="mt-3 space-y-2 text-sm">
            {summary.topPages.length === 0 && (
              <li className="text-muted-foreground">Няма данни още.</li>
            )}
            {summary.topPages.map((page) => {
              const slug = page.path.match(/^\/statia\/([^/?]+)/)?.[1];
              const title = slug ? titleBySlug.get(slug) : null;
              return (
                <li key={page.path} className="flex items-center justify-between gap-3">
                  <span className="truncate text-foreground">{title ?? page.path}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {page.views.toLocaleString("bg-BG")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">Източници на трафик</p>
          <ul className="mt-3 space-y-2 text-sm">
            {summary.channels.length === 0 && (
              <li className="text-muted-foreground">Няма данни още.</li>
            )}
            {summary.channels.map((c) => (
              <li key={c.channel} className="flex items-center justify-between gap-3">
                <span className="text-foreground">{CHANNEL_LABELS[c.channel] ?? c.channel}</span>
                <span className="text-muted-foreground">{c.sessions.toLocaleString("bg-BG")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
