import { prisma } from "@/lib/prisma";
import { searchUnsplashPhoto, triggerUnsplashDownload, isUnsplashConfigured } from "@/lib/images/unsplash";

// How many of a category's most recent Unsplash picks to avoid repeating --
// there's no local pool to round-robin through like stock photos, so this
// is the only thing keeping a fresh search from returning the same photo.
const UNSPLASH_HISTORY_SIZE = 15;

async function assignStockPhoto(articleId: string, categoryId: string): Promise<boolean> {
  const photo = await prisma.stockPhoto.findFirst({
    where: { categoryId },
    orderBy: { lastUsedAt: { sort: "asc", nulls: "first" } },
  });
  if (!photo) return false;

  await prisma.$transaction([
    prisma.article.update({
      where: { id: articleId },
      data: { imageUrl: photo.imageUrl, imageAttributionName: null, imageAttributionUrl: null },
    }),
    prisma.stockPhoto.update({ where: { id: photo.id }, data: { lastUsedAt: new Date() } }),
  ]);
  return true;
}

async function assignUnsplashPhoto(articleId: string, categoryId: string, keywords: string): Promise<boolean> {
  const recent = await prisma.unsplashUsage.findMany({
    where: { categoryId },
    orderBy: { usedAt: "desc" },
    take: UNSPLASH_HISTORY_SIZE,
    select: { unsplashId: true },
  });

  const photo = await searchUnsplashPhoto(
    keywords,
    recent.map((r) => r.unsplashId)
  );
  if (!photo) return false;

  await prisma.article.update({
    where: { id: articleId },
    data: {
      imageUrl: photo.url,
      imageAttributionName: photo.photographerName,
      imageAttributionUrl: photo.photographerUrl,
    },
  });
  await prisma.unsplashUsage.create({ data: { categoryId, unsplashId: photo.id } });

  // Fire-and-forget -- required by Unsplash's guidelines, but must never
  // block or fail the article update that already succeeded above.
  triggerUnsplashDownload(photo.downloadLocation).catch(() => {});

  return true;
}

// Called only at publish time (not on draft save) so there's still a
// window to add a real photo first. Priority: her own uploaded stock
// photos first (curated on purpose), Unsplash only fills the gap when
// nothing local exists yet for that category.
export async function applyCategoryStockPhotoFallback(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      imageUrl: true,
      categoryId: true,
      _count: { select: { photos: true } },
      category: { select: { unsplashKeywords: true } },
    },
  });

  if (!article || article.imageUrl || article._count.photos > 0 || !article.categoryId) {
    return;
  }

  const gotStockPhoto = await assignStockPhoto(articleId, article.categoryId);
  if (gotStockPhoto) return;

  if (isUnsplashConfigured() && article.category?.unsplashKeywords) {
    await assignUnsplashPhoto(articleId, article.categoryId, article.category.unsplashKeywords);
  }
}

// Bulk backfill for existing articles that never got a cover image (e.g.
// published before stock photos existed, or before a given category had any
// uploaded). Grouped by category so each category's stock pool is fetched
// once and round-robined in memory, instead of one query per article --
// keeps this fast even for hundreds of articles.
export async function backfillMissingCoverImages(): Promise<{ assigned: number; skipped: number }> {
  const articles = await prisma.article.findMany({
    where: { imageUrl: null },
    select: {
      id: true,
      categoryId: true,
      photos: { orderBy: { order: "asc" }, take: 1, select: { imageUrl: true } },
    },
  });

  let assigned = 0;
  let skipped = 0;
  const writes: Promise<unknown>[] = [];

  const needsStockPhoto: typeof articles = [];
  for (const article of articles) {
    // Already has its own gallery -- use that instead of a generic stock
    // photo, same as the auto-derive-from-gallery behavior on upload.
    const firstGalleryPhoto = article.photos[0]?.imageUrl;
    if (firstGalleryPhoto) {
      writes.push(
        prisma.article.update({ where: { id: article.id }, data: { imageUrl: firstGalleryPhoto } })
      );
      assigned += 1;
    } else {
      needsStockPhoto.push(article);
    }
  }

  const byCategory = new Map<string, typeof needsStockPhoto>();
  for (const article of needsStockPhoto) {
    if (!article.categoryId) {
      skipped += 1;
      continue;
    }
    const list = byCategory.get(article.categoryId) ?? [];
    list.push(article);
    byCategory.set(article.categoryId, list);
  }

  for (const [categoryId, categoryArticles] of byCategory) {
    const pool = await prisma.stockPhoto.findMany({
      where: { categoryId },
      orderBy: { lastUsedAt: { sort: "asc", nulls: "first" } },
    });

    if (pool.length === 0) {
      skipped += categoryArticles.length;
      continue;
    }

    const usedPhotoIds = new Set<string>();
    categoryArticles.forEach((article, i) => {
      const photo = pool[i % pool.length];
      usedPhotoIds.add(photo.id);
      writes.push(
        prisma.article.update({ where: { id: article.id }, data: { imageUrl: photo.imageUrl } })
      );
      assigned += 1;
    });

    const now = new Date();
    for (const id of usedPhotoIds) {
      writes.push(prisma.stockPhoto.update({ where: { id }, data: { lastUsedAt: now } }));
    }
  }

  await Promise.all(writes);

  return { assigned, skipped };
}
