import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { siteUrl } from "@/lib/newsletter/resend-client";

// Without this, Next.js treats /sitemap.xml as static and tries to query the
// database at *build time* (a separate, more restricted environment than
// runtime) — which is what broke the Vercel build. Forcing dynamic also means
// the sitemap always reflects newly published articles instead of going
// stale until the next deploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await prisma.article.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "hourly", priority: 1 },
    ...CATEGORIES.map((category) => ({
      url: siteUrl(`/kategoriya/${category.slug}`),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: siteUrl(`/statia/${article.slug}`),
    lastModified: article.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticEntries, ...articleEntries];
}
