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

const SINGLETON_ID = "singleton";

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

export async function getSocialLinks() {
  return prisma.socialLinks.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export async function updateSocialLinks(formData: FormData) {
  await requireAdmin();

  const data: Record<string, string | null> = {};
  for (const platform of PLATFORMS) {
    const value = String(formData.get(platform) ?? "").trim();
    data[platform] = value || null;
  }

  await prisma.socialLinks.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });

  revalidatePath("/admin/stranitsi/sotsialni-mrezhi");
  revalidatePath("/");
  redirect("/admin/stranitsi/sotsialni-mrezhi");
}
