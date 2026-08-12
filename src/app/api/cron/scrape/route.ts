import { NextResponse } from "next/server";
import { runScraper } from "@/lib/scraper/run";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runScraper();

  return NextResponse.json({
    ok: true,
    results,
  });
}
