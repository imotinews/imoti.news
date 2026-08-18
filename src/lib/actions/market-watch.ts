"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/images/store";

const MAX_STATS = 5;

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

export type MarketWatchStat = { label: string; value: string; changePct: number | null };

async function getOrCreateMarketWatch() {
  const existing = await prisma.marketWatch.findFirst();
  if (existing) return existing;
  return prisma.marketWatch.create({ data: { summary: "", stats: [] } });
}

export async function getMarketWatch() {
  return getOrCreateMarketWatch();
}

export async function updateMarketWatch(formData: FormData) {
  await requireAdmin();

  const current = await getOrCreateMarketWatch();

  const summary = String(formData.get("summary") ?? "").trim();

  const stats: MarketWatchStat[] = [];
  for (let i = 0; i < MAX_STATS; i++) {
    const label = String(formData.get(`statLabel${i}`) ?? "").trim();
    const value = String(formData.get(`statValue${i}`) ?? "").trim();
    const changeRaw = String(formData.get(`statChange${i}`) ?? "").trim();
    if (!label || !value) continue;
    const changePct = changeRaw ? Number(changeRaw.replace(",", ".")) : null;
    stats.push({ label, value, changePct: Number.isFinite(changePct) ? changePct : null });
  }

  await prisma.marketWatch.update({
    where: { id: current.id },
    data: { summary, stats },
  });

  revalidatePath("/admin/market-watch");
  revalidatePath("/");
  redirect("/admin/market-watch");
}

// The screenshot uploads straight from the browser to Blob storage
// (bypassing Vercel's ~4.5MB serverless request-body cap) -- this just
// records the resulting URL.
export async function setMarketWatchImageFromUpload(url: string) {
  await requireAdmin();
  const current = await getOrCreateMarketWatch();
  if (current.imageUrl) await deleteImage(current.imageUrl);
  await prisma.marketWatch.update({ where: { id: current.id }, data: { imageUrl: url } });
  revalidatePath("/admin/market-watch");
  revalidatePath("/");
}

export async function removeMarketWatchImage() {
  await requireAdmin();
  const current = await getOrCreateMarketWatch();
  if (current.imageUrl) {
    await deleteImage(current.imageUrl);
    await prisma.marketWatch.update({ where: { id: current.id }, data: { imageUrl: null } });
  }
  revalidatePath("/admin/market-watch");
  revalidatePath("/");
}
