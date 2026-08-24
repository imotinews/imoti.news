"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runScraper } from "@/lib/scraper/run";

export async function runScraperNow() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }

  const totalSources = await prisma.source.count({ where: { active: true } });
  const run = await prisma.scrapeRun.create({ data: { totalSources } });

  // A full run across many sources, with the per-item AI rate-limit delay,
  // can take longer than the request is willing to wait -- the browser was
  // showing "This page can't be loaded" even though the run kept going and
  // finished fine server-side. Detaching it with after() means the request
  // returns immediately; live progress is shown on admin/sources via the
  // ScrapeRun row this action just created (polled by ScrapeProgressPanel).
  after(async () => {
    await runScraper(run.id);
    revalidatePath("/admin/sources");
    revalidatePath("/admin/articles");
    // The draft-count badge lives in the shared admin layout, not the
    // /admin/articles page itself -- without this it stays stale until
    // something else happens to revalidate the layout.
    revalidatePath("/admin", "layout");
  });

  redirect("/admin/sources");
}

export async function getLatestScrapeRun() {
  return prisma.scrapeRun.findFirst({ orderBy: { startedAt: "desc" } });
}
