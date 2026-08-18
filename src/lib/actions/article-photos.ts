"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/images/store";

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

export async function uploadArticlePhotos(articleId: string, formData: FormData) {
  await requireAdmin();

  const files = formData.getAll("photoFiles").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  const last = await prisma.articlePhoto.findFirst({
    where: { articleId },
    orderBy: { order: "desc" },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage({ bytes, contentType: file.type }, `${articleId}-gallery`);
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
