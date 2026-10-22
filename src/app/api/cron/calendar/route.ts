import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runDueSchedules } from "@/lib/calendar/run";
import { SCRAPING_PAUSED } from "@/lib/site-status";

// Reading a PDF and one AI call per due item -- well past the implicit default.
export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (SCRAPING_PAUSED) {
    return NextResponse.json({ ok: true, skipped: true, reason: "scraping paused" });
  }

  const results = await runDueSchedules();

  revalidatePath("/admin/kalendar");
  revalidatePath("/admin/articles");
  revalidatePath("/admin", "layout");

  return NextResponse.json({ ok: true, results });
}
