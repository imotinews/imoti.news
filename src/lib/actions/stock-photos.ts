"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/images/store";

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

export async function uploadStockPhotos(formData: FormData) {
  await requireAdmin();

  const files = formData.getAll("imageFiles").filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage({ bytes, contentType: file.type }, "stock");
    await prisma.stockPhoto.create({ data: { imageUrl: url } });
  }

  revalidatePath("/admin/stock-photos");
  redirect("/admin/stock-photos");
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
