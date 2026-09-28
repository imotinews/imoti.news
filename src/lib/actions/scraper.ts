"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runScraper, runScraperForSource } from "@/lib/scraper/run";

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

// A run killed mid-flight by Vercel's function duration limit never gets a
// chance to mark itself "failed" -- it just sits at "running" forever, and
// the admin progress panel would show a live spinner indefinitely. Anything
// still "running" long after a run could plausibly finish is self-healed
// here instead of needing manual DB surgery.
const STALE_RUN_MINUTES = 20;

export async function getLatestScrapeRun() {
  const run = await prisma.scrapeRun.findFirst({ orderBy: { startedAt: "desc" } });
  if (run && run.status === "running") {
    const ageMinutes = (Date.now() - run.startedAt.getTime()) / 60000;
    if (ageMinutes > STALE_RUN_MINUTES) {
      return prisma.scrapeRun.update({
        where: { id: run.id },
        data: { status: "failed", finishedAt: new Date() },
      });
    }
  }
  return run;
}

// Independent of the scheduled/full run -- doesn't skip this source from
// future full runs, since URL-level dedup already prevents re-creating
// anything a full run would later see again for the same source.
export async function runSourceScrapeNow(sourceId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }

  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
  const run = await prisma.scrapeRun.create({
    data: { totalSources: 1, currentSourceName: source.name, sourceId: source.id },
  });

  after(async () => {
    await runScraperForSource(sourceId, run.id);
    revalidatePath("/admin/sources");
    revalidatePath("/admin/articles");
    revalidatePath("/admin", "layout");
  });

  revalidatePath("/admin/sources");
}
