"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runPriceStatsScrape, type PriceStatsSourceResult } from "@/lib/price-stats/run";

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

export async function runPriceStatsScrapeNow(): Promise<PriceStatsSourceResult[]> {
  await requireAdmin();
  const results = await runPriceStatsScrape();
  revalidatePath("/admin/market-watch");
  return results;
}

const SOURCE_LABELS: Record<string, string> = {
  imot_bg: "Imot.bg",
  imoti_net: "Imoti.net",
  alo_bg: "Alo.bg",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export type PriceStatsSourceSummary = {
  source: string;
  count: number;
  lastAsOfDate: Date | null;
  lastScrapedAt: Date | null;
};

export async function getPriceStatsSummary(): Promise<PriceStatsSourceSummary[]> {
  const grouped = await prisma.marketPriceStat.groupBy({
    by: ["source"],
    _count: { _all: true },
    _max: { asOfDate: true, scrapedAt: true },
  });

  return grouped.map((g) => ({
    source: g.source,
    count: g._count._all,
    lastAsOfDate: g._max.asOfDate,
    lastScrapedAt: g._max.scrapedAt,
  }));
}

// Rows for the most recent snapshot only (per source) -- older weeks stay
// in the database for future trend-building, just not shown in this raw view.
export async function getLatestMarketPriceStats() {
  const latestPerSource = await prisma.marketPriceStat.groupBy({
    by: ["source"],
    _max: { asOfDate: true },
  });

  const dateBySource = new Map(latestPerSource.map((r) => [r.source, r._max.asOfDate]));
  if (dateBySource.size === 0) return [];

  const rows = await prisma.marketPriceStat.findMany({
    where: {
      OR: Array.from(dateBySource.entries()).map(([source, asOfDate]) => ({
        source,
        asOfDate: asOfDate ?? undefined,
      })),
    },
    orderBy: [{ source: "asc" }, { district: "asc" }, { propertyType: "asc" }],
  });

  return rows;
}
