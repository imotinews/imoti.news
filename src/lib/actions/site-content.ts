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

export async function updateSiteContent(slug: string, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    throw new Error("Заглавието и текстът са задължителни.");
  }

  await prisma.siteContent.update({ where: { slug }, data: { title, body } });

  revalidatePath("/admin/stranitsi");
  revalidatePath(`/${slug}`);
  redirect("/admin/stranitsi");
}
