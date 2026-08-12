import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { siteUrl } from "@/lib/newsletter/resend-client";

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
