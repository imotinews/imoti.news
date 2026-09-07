import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runPriceStatsScrape } from "@/lib/price-stats/run";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No AI calls here, just 3 quick page fetches -- unlike the news scraper,
  // finishes well within a normal request, no need to detach with after().
  const results = await runPriceStatsScrape();

  revalidatePath("/admin/market-watch");

  return NextResponse.json({ ok: true, results });
}
