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
