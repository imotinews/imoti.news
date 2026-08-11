import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pending, publishedToday, totalPublished, totalDraft] = await Promise.all([
    prisma.article.count({ where: { status: "draft" } }),
    prisma.article.count({
      where: { status: "published", publishedAt: { gte: startOfToday } },
    }),
    prisma.article.count({ where: { status: "published" } }),
    prisma.article.count({ where: { status: "draft" } }),
  ]);

  return { pending, publishedToday, totalPublished, totalDraft };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Чакащи одобрение", value: stats.pending, href: "/admin/articles?status=draft" },
    { label: "Публикувани днес", value: stats.publishedToday, href: "/admin/articles?status=published" },
    { label: "Общо публикувани", value: stats.totalPublished, href: "/admin/articles?status=published" },
    { label: "Чернови", value: stats.totalDraft, href: "/admin/articles?status=draft" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Табло</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/articles/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          + Нова новина
        </Link>
        <Link
          href="/admin/reklami/new"
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
        >
          + Нова реклама
        </Link>
      </div>
    </div>
  );
}
