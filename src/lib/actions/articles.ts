"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deriveExcerpt, generateUniqueSlug } from "@/lib/article-helpers";
import {
  uploadImage,
  deleteImage,
  fetchImageFromUrl,
  generateImageWithAI,
  ImageGenQuotaError,
} from "@/lib/images/store";
import { applyCategoryStockPhotoFallback } from "@/lib/actions/stock-photo-fallback";

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

function parseContent(raw: string): string {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export async function createArticle(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const content = parseContent(String(formData.get("content") ?? ""));
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  const originalUrl = String(formData.get("originalUrl") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!title || !content || !sourceName || !originalUrl) {
    throw new Error("Моля, попълни всички задължителни полета.");
  }

  const slug = await generateUniqueSlug(title);

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      excerpt: deriveExcerpt(content),
      rewrittenContent: content,
      sourceName,
      originalUrl,
      categoryId,
      status,
      aiGenerated: false,
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  if (status === "published") {
    await applyCategoryStockPhotoFallback(article.id);
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  redirect("/admin/articles");
}

export async function updateArticle(id: string, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const content = parseContent(String(formData.get("content") ?? ""));
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  const originalUrl = String(formData.get("originalUrl") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!title || !content || !sourceName || !originalUrl) {
    throw new Error("Моля, попълни всички задължителни полета.");
  }

  const existing = await prisma.article.findUnique({ where: { id } });

  await prisma.article.update({
    where: { id },
    data: {
      title,
      excerpt: deriveExcerpt(content),
      rewrittenContent: content,
      sourceName,
      originalUrl,
      categoryId,
      status,
      publishedAt:
        status === "published" ? (existing?.publishedAt ?? new Date()) : null,
    },
  });

  if (status === "published") {
    await applyCategoryStockPhotoFallback(id);
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  redirect("/admin/articles");
}

export async function publishArticle(id: string) {
  await requireAdmin();

  const article = await prisma.article.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });

  await applyCategoryStockPhotoFallback(id);

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath(`/statia/${article.slug}`);
}

export async function unpublishArticle(id: string) {
  await requireAdmin();

  await prisma.article.update({
    where: { id },
    data: { status: "draft" },
  });

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

// Stock photos are shared across many articles -- deleting the underlying
// blob just because one article stopped using it would break every other
// article still pointing at the same URL. Skip the delete for those. Also
// skip anything not hosted on our own Blob storage (e.g. an Unsplash CDN
// URL) -- there's nothing of ours to delete, and it isn't a file we own.
async function deleteArticleImageBlob(url: string) {
  if (!url.includes(".public.blob.vercel-storage.com")) return;
  const isStock = await prisma.stockPhoto.findFirst({ where: { imageUrl: url }, select: { id: true } });
  if (isStock) return;
  await deleteImage(url);
}

async function replaceArticleImage(id: string, newUrl: string) {
  const existing = await prisma.article.findUnique({ where: { id }, select: { imageUrl: true } });

  // Any manual replacement (upload, URL extract, AI-gen, stock pick) means
  // this is no longer the Unsplash pick that may have set these -- stale
  // attribution under someone else's photo would be both wrong and a
  // guideline violation.
  await prisma.article.update({
    where: { id },
    data: { imageUrl: newUrl, imageAttributionName: null, imageAttributionUrl: null },
  });

  if (existing?.imageUrl) {
    await deleteArticleImageBlob(existing.imageUrl);
  }

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/");
}

export async function setArticleImageFromStock(id: string, stockImageUrl: string) {
  await requireAdmin();
  await replaceArticleImage(id, stockImageUrl);
}

export type ImageActionState = { status: "idle" | "success" | "error"; message?: string };

// The file itself is uploaded directly from the browser to Blob storage
// (bypassing Vercel's ~4.5MB serverless request-body cap) -- this just
// records the resulting URL against the article.
export async function setArticleImageFromUpload(id: string, url: string) {
  await requireAdmin();
  await replaceArticleImage(id, url);
}

export async function setArticleImageFromUrl(
  id: string,
  _prevState: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  await requireAdmin();

  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  if (!sourceUrl) {
    return { status: "error", message: "Въведи URL адрес." };
  }

  const image = await fetchImageFromUrl(sourceUrl);
  if (!image) {
    return { status: "error", message: "Не успях да извлека снимка от този адрес." };
  }

  const url = await uploadImage(image, id);
  await replaceArticleImage(id, url);

  return { status: "success" };
}

export async function generateArticleImage(
  id: string,
  _prevState: ImageActionState
): Promise<ImageActionState> {
  await requireAdmin();

  const article = await prisma.article.findUnique({
    where: { id },
    select: { title: true, excerpt: true },
  });
  if (!article) {
    return { status: "error", message: "Статията не е намерена." };
  }

  let image;
  try {
    image = await generateImageWithAI({ title: article.title, excerpt: article.excerpt ?? "" });
  } catch (error) {
    if (error instanceof ImageGenQuotaError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "AI генерирането се провали. Опитай пак." };
  }
  if (!image) {
    return { status: "error", message: "AI генерирането се провали. Опитай пак." };
  }

  const url = await uploadImage(image, id);
  await replaceArticleImage(id, url);

  return { status: "success" };
}

export async function removeArticleImage(id: string) {
  await requireAdmin();

  const existing = await prisma.article.findUnique({ where: { id }, select: { imageUrl: true } });
  await prisma.article.update({
    where: { id },
    data: { imageUrl: null, imageAttributionName: null, imageAttributionUrl: null },
  });

  if (existing?.imageUrl) {
    await deleteArticleImageBlob(existing.imageUrl);
  }

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/");
}

export async function updateArticlePlacement(id: string, formData: FormData) {
  await requireAdmin();

  const isHero = formData.get("isHero") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const isOriginal = formData.get("isOriginal") === "on";

  await prisma.$transaction(async (tx) => {
    if (isHero) {
      // Only one article can be the hero at a time.
      await tx.article.updateMany({ where: { isHero: true, NOT: { id } }, data: { isHero: false } });
    }
    await tx.article.update({ where: { id }, data: { isHero, isFeatured, isOriginal } });
  });

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/");
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/articles");
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}
