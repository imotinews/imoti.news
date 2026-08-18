"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-я\s-]/gi, "")
    .replace(/\s+/g, "-");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const scrapable = formData.get("scrapable") === "on";

  if (!name) {
    throw new Error("Името е задължително.");
  }

  const slug = slugify(slugInput || name);
  if (!slug) {
    throw new Error("Не успях да образувам валиден slug от това име.");
  }

  await prisma.category.create({ data: { name, slug, scrapable } });

  revalidatePath("/admin/kategorii");
  revalidatePath("/");
  redirect("/admin/kategorii");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const scrapable = formData.get("scrapable") === "on";

  if (!name) {
    throw new Error("Името е задължително.");
  }

  await prisma.category.update({ where: { id }, data: { name, scrapable } });

  revalidatePath("/admin/kategorii");
  revalidatePath("/");
  redirect("/admin/kategorii");
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const articleCount = await prisma.article.count({ where: { categoryId: id } });
  if (articleCount > 0) {
    throw new Error(
      `Не може да се изтрие — ${articleCount} статии все още са в тази категория. Първо ги премести.`
    );
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/kategorii");
  revalidatePath("/");
}
