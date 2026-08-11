"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const POSITIONS = ["header", "sidebar", "in_article", "footer"] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : null;
}

function readAdFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const position = POSITIONS.includes(formData.get("position") as (typeof POSITIONS)[number])
    ? (formData.get("position") as (typeof POSITIONS)[number])
    : "header";
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const htmlCode = String(formData.get("htmlCode") ?? "").trim() || null;
  const targetUrl = String(formData.get("targetUrl") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  const startDate = parseDate(formData.get("startDate"));
  const endDate = parseDate(formData.get("endDate"));

  if (!name) {
    throw new Error("Името на рекламата е задължително.");
  }

  return { name, position, imageUrl, htmlCode, targetUrl, active, startDate, endDate };
}

export async function createAd(formData: FormData) {
  await requireAdmin();
  const data = readAdFields(formData);

  await prisma.adBanner.create({ data });

  revalidatePath("/admin/reklami");
  redirect("/admin/reklami");
}

export async function updateAd(id: string, formData: FormData) {
  await requireAdmin();
  const data = readAdFields(formData);

  await prisma.adBanner.update({ where: { id }, data });

  revalidatePath("/admin/reklami");
  redirect("/admin/reklami");
}

export async function deleteAd(id: string) {
  await requireAdmin();
  await prisma.adBanner.delete({ where: { id } });
  revalidatePath("/admin/reklami");
}
