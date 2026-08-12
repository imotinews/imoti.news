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

function readSourceFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const type = formData.get("type") === "scrape" ? "scrape" : "rss";
  const active = formData.get("active") === "on";

  if (!name || !url) {
    throw new Error("Името и URL адресът са задължителни.");
  }

  return { name, url, type, active } as const;
}

export async function createSource(formData: FormData) {
  await requireAdmin();
  const data = readSourceFields(formData);

  await prisma.source.create({ data });

  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

export async function updateSource(id: string, formData: FormData) {
  await requireAdmin();
  const data = readSourceFields(formData);

  await prisma.source.update({ where: { id }, data });

  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

export async function deleteSource(id: string) {
  await requireAdmin();
  await prisma.source.delete({ where: { id } });
  revalidatePath("/admin/sources");
}
