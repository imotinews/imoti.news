"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "linkedin",
  "youtube",
  "tiktok",
  "telegram",
  "viber",
] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

export async function getSocialLinks() {
  const existing = await prisma.socialLinks.findFirst();
  if (existing) return existing;
  return prisma.socialLinks.create({ data: {} });
}

export async function updateSocialLinks(formData: FormData) {
  await requireAdmin();

  const current = await getSocialLinks();

  const data: Record<string, string | null> = {};
  for (const platform of PLATFORMS) {
    const value = String(formData.get(platform) ?? "").trim();
    data[platform] = value || null;
  }

  await prisma.socialLinks.update({ where: { id: current.id }, data });

  revalidatePath("/admin/stranitsi/sotsialni-mrezhi");
  revalidatePath("/");
  redirect("/admin/stranitsi/sotsialni-mrezhi");
}
