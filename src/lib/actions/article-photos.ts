"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/images/store";

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

async function revalidateArticle(articleId: string) {
  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { slug: true } });
  revalidatePath(`/admin/articles/${articleId}`);
  if (article) revalidatePath(`/statia/${article.slug}`);
}

// The actual file bytes are uploaded straight from the browser to Blob
// storage (see BlobUploadInput) -- this only persists the resulting URLs,
// so the request stays tiny regardless of how many/how large the photos are.
export async function createArticlePhotosFromUrls(articleId: string, urls: string[]) {
  await requireAdmin();
  if (urls.length === 0) return;

  const last = await prisma.articlePhoto.findFirst({
    where: { articleId },
    orderBy: { order: "desc" },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  for (const url of urls) {
    await prisma.articlePhoto.create({ data: { articleId, imageUrl: url, order: nextOrder } });
    nextOrder += 1;
  }

  await revalidateArticle(articleId);
}

export async function deleteArticlePhoto(id: string) {
  await requireAdmin();

  const photo = await prisma.articlePhoto.findUnique({ where: { id } });
  if (!photo) return;

  await prisma.articlePhoto.delete({ where: { id } });
  await deleteImage(photo.imageUrl);
  await revalidateArticle(photo.articleId);
}

export async function updateArticlePhotoCaption(id: string, formData: FormData) {
  await requireAdmin();

  const caption = String(formData.get("caption") ?? "").trim() || null;
  const photo = await prisma.articlePhoto.update({ where: { id }, data: { caption } });
  await revalidateArticle(photo.articleId);
}

export async function moveArticlePhoto(id: string, direction: "up" | "down") {
  await requireAdmin();

  const photo = await prisma.articlePhoto.findUnique({ where: { id } });
  if (!photo) return;

  const neighbor = await prisma.articlePhoto.findFirst({
    where: {
      articleId: photo.articleId,
      order: direction === "up" ? { lt: photo.order } : { gt: photo.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;

  await prisma.$transaction([
    prisma.articlePhoto.update({ where: { id: photo.id }, data: { order: neighbor.order } }),
    prisma.articlePhoto.update({ where: { id: neighbor.id }, data: { order: photo.order } }),
  ]);

  await revalidateArticle(photo.articleId);
}
