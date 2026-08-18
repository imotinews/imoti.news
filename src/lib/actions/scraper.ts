"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { runScraper } from "@/lib/scraper/run";

export async function runScraperNow() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }

  // A full run across many sources, with the per-item AI rate-limit delay,
  // can take longer than the request is willing to wait -- the browser was
  // showing "This page can't be loaded" even though the run kept going and
  // finished fine server-side. Detaching it with after() means the request
  // returns immediately; progress is visible on admin/sources (per-source
  // "last attempt" + stats) as it writes to the database.
  after(async () => {
    await runScraper();
    revalidatePath("/admin/sources");
    revalidatePath("/admin/articles");
    // The draft-count badge lives in the shared admin layout, not the
    // /admin/articles page itself -- without this it stays stale until
    // something else happens to revalidate the layout.
    revalidatePath("/admin", "layout");
  });

  redirect("/admin/sources?started=1");
}
