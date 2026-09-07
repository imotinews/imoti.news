import { prisma } from "@/lib/prisma";
import { scrapeImotBg } from "./sources/imot-bg";
import { scrapeImotiNet } from "./sources/imoti-net";
import { scrapeAloBg } from "./sources/alo-bg";
import type { RawPriceRow } from "./types";

const CITY = "Пловдив";
const DEAL_TYPE = "prodazhbi";

export type PriceStatsSourceResult = { source: string; rowsSaved: number; error: string | null };

async function saveRows(source: string, rows: RawPriceRow[], asOfDate: Date): Promise<number> {
  let saved = 0;
  for (const row of rows) {
    await prisma.marketPriceStat.upsert({
      where: {
        source_city_dealType_district_propertyType_asOfDate: {
          source,
          city: CITY,
          dealType: DEAL_TYPE,
          district: row.district,
          propertyType: row.propertyType,
          asOfDate,
        },
      },
      create: {
        source,
        city: CITY,
        dealType: DEAL_TYPE,
        district: row.district,
        propertyType: row.propertyType,
        price: row.price,
        pricePerSqm: row.pricePerSqm,
        listingCount: row.listingCount,
        asOfDate,
      },
      update: {
        price: row.price,
        pricePerSqm: row.pricePerSqm,
        listingCount: row.listingCount,
      },
    });
    saved += 1;
  }
  return saved;
}

// Each site is fetched and saved independently -- one failing (layout
// change, temporary block, timeout) shouldn't lose the other two's data
// for the week.
export async function runPriceStatsScrape(): Promise<PriceStatsSourceResult[]> {
  const asOfDate = new Date(new Date().toISOString().slice(0, 10));

  const jobs: { source: string; fn: () => Promise<RawPriceRow[]> }[] = [
    { source: "imot_bg", fn: scrapeImotBg },
    { source: "imoti_net", fn: scrapeImotiNet },
    { source: "alo_bg", fn: scrapeAloBg },
  ];

  const results: PriceStatsSourceResult[] = [];

  for (const job of jobs) {
    try {
      const rows = await job.fn();
      const rowsSaved = await saveRows(job.source, rows, asOfDate);
      results.push({ source: job.source, rowsSaved, error: null });
    } catch (error) {
      console.error(`[price-stats] ${job.source} failed:`, error);
      results.push({ source: job.source, rowsSaved: 0, error: (error as Error).message });
    }
  }

  return results;
}
