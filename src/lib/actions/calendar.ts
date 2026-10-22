"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runSchedule } from "@/lib/calendar/run";
import { SCRAPING_PAUSED } from "@/lib/site-status";

export type RunScheduleState = { status?: "created" | "nothing_new" | "error"; message?: string };

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

export async function runScheduleNow(_prev: RunScheduleState, formData: FormData): Promise<RunScheduleState> {
  await requireAdmin();
  if (SCRAPING_PAUSED) {
    return { status: "error", message: "Скрейпването е временно спряно." };
  }

  const id = String(formData.get("id") ?? "");
  const result = await runSchedule(id);

  revalidatePath("/admin/kalendar");
  revalidatePath("/admin/articles");
  revalidatePath("/admin", "layout");

  return { status: result.status, message: result.message };
}

export async function toggleSchedule(id: string) {
  await requireAdmin();
  const schedule = await prisma.publicationSchedule.findUniqueOrThrow({ where: { id } });
  await prisma.publicationSchedule.update({ where: { id }, data: { active: !schedule.active } });
  revalidatePath("/admin/kalendar");
}
