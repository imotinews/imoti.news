import { prisma } from "@/lib/prisma";

export function getLatestPublished(limit?: number) {
  return prisma.article.findMany({
    where: { status: "published" },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export function getPublishedByCategorySlug(categorySlug: string) {
  return prisma.article.findMany({
    where: { status: "published", category: { slug: categorySlug } },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  });
}

export function getPublishedBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug, status: "published" },
    include: { category: true },
  });
}

export function searchPublished(query: string) {
  const normalized = query.trim();
  if (!normalized) return Promise.resolve([]);

  return prisma.article.findMany({
    where: {
      status: "published",
      OR: [
        { title: { contains: normalized, mode: "insensitive" } },
        { excerpt: { contains: normalized, mode: "insensitive" } },
      ],
    },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  });
}
