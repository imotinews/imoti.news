"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { runScraper } from "@/lib/scraper/run";

export async function runScraperNow() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }

  const results = await runScraper();

  const created = results.reduce((sum, r) => sum + r.created, 0);
  const irrelevant = results.reduce((sum, r) => sum + r.skippedIrrelevant, 0);
  const duplicates = results.reduce((sum, r) => sum + r.skippedDuplicate, 0);
  const errors = results.reduce((sum, r) => sum + r.errors.length, 0);

  revalidatePath("/admin/sources");
  revalidatePath("/admin/articles");
  redirect(
    `/admin/sources?ran=1&created=${created}&irrelevant=${irrelevant}&duplicates=${duplicates}&errors=${errors}`
  );
}
