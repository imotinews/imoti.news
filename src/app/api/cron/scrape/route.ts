import { NextResponse } from "next/server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { runScraper } from "@/lib/scraper/run";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Same fix as the manual "Изтегли новини сега" button: a full run across
  // many sources with the per-item AI rate-limit delay can take minutes,
  // well past Vercel's synchronous function execution limit. Awaiting it
  // directly here risked the cron invocation being killed mid-run. after()
  // detaches the work so this request returns immediately.
  after(async () => {
    await runScraper();
    revalidatePath("/admin/sources");
    revalidatePath("/admin/articles");
    revalidatePath("/admin", "layout");
  });

  return NextResponse.json({ ok: true, started: true });
}
