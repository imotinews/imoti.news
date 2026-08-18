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

// Files upload straight from the browser to Blob storage -- this only
// persists the resulting URLs, keeping the request tiny no matter how
// many photos are selected at once.
export async function createStockPhotosFromUrls(urls: string[], categoryId: string | null) {
  await requireAdmin();
  for (const url of urls) {
    await prisma.stockPhoto.create({ data: { imageUrl: url, categoryId } });
  }
  revalidatePath("/admin/stock-photos");
}

export async function updateStockPhotoCategory(id: string, formData: FormData) {
  await requireAdmin();
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  await prisma.stockPhoto.update({ where: { id }, data: { categoryId } });
  revalidatePath("/admin/stock-photos");
}

export async function deleteStockPhoto(id: string) {
  await requireAdmin();

  const photo = await prisma.stockPhoto.findUnique({ where: { id } });
  if (!photo) return;

  await prisma.stockPhoto.delete({ where: { id } });
  // Articles that already picked this photo keep their own copy of the URL
  // and go on displaying it fine -- deleting it here only removes it from
  // the picker for future selections. If nothing else references it, the
  // blob itself is deleted; deleteArticleImage's stock-check protects any
  // article that's still actively using it (see articles.ts).
  const stillUsed = await prisma.article.findFirst({ where: { imageUrl: photo.imageUrl } });
  if (!stillUsed) {
    await deleteImage(photo.imageUrl);
  }

  revalidatePath("/admin/stock-photos");
}
