import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Wrapped with React's cache() so generateMetadata and the page component
// (which both need the same data) share a single DB round trip per request.

export const getLatestPublished = cache((limit?: number) => {
  return prisma.article.findMany({
    where: { status: "published" },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
});

// Fetched independently of getLatestPublished's limit -- the hero article is
// meant to stay pinned until an admin picks a new one, not fall back to
// "just the newest article" once enough other articles are published after
// it to push it past that limit.
export const getHeroArticle = cache(() => {
  return prisma.article.findFirst({
    where: { status: "published", isHero: true },
    include: { category: true },
  });
});

export const getPublishedByCategorySlug = cache((categorySlug: string) => {
  return prisma.article.findMany({
    where: { status: "published", category: { slug: categorySlug } },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  });
});

export const getPublishedBySlug = cache((slug: string) => {
  return prisma.article.findUnique({
    where: { slug, status: "published" },
    include: { category: true, photos: { orderBy: { order: "asc" } } },
  });
});

export const searchPublished = cache((query: string) => {
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
});
