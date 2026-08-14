"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deriveExcerpt, generateUniqueSlug } from "@/lib/article-helpers";

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

  await prisma.article.create({
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

  revalidatePath("/admin/articles");
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

  revalidatePath("/admin/articles");
  revalidatePath("/");
  redirect("/admin/articles");
}

export async function publishArticle(id: string) {
  await requireAdmin();

  const article = await prisma.article.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
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
  revalidatePath("/");
}

export async function deleteArticle(id: string) {
  await requireAdmin();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/articles");
  revalidatePath("/");
}
