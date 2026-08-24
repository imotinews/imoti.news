import { prisma } from "@/lib/prisma";

// Called only at publish time (not on draft save) so there's still a
// window to add a real photo first. Picks the least-recently-used stock
// photo in the article's category -- never-used photos (lastUsedAt null)
// sort first, so a fresh batch cycles through evenly before repeating.
export async function applyCategoryStockPhotoFallback(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { imageUrl: true, categoryId: true, _count: { select: { photos: true } } },
  });

  if (!article || article.imageUrl || article._count.photos > 0 || !article.categoryId) {
    return;
  }

  const photo = await prisma.stockPhoto.findFirst({
    where: { categoryId: article.categoryId },
    orderBy: { lastUsedAt: { sort: "asc", nulls: "first" } },
  });

  if (!photo) return;

  await prisma.$transaction([
    prisma.article.update({ where: { id: articleId }, data: { imageUrl: photo.imageUrl } }),
    prisma.stockPhoto.update({ where: { id: photo.id }, data: { lastUsedAt: new Date() } }),
  ]);
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
