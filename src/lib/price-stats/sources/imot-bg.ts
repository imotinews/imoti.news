import { JSDOM } from "jsdom";
import { parseBgNumber } from "../parse-helpers";
import type { RawPriceRow } from "../types";

const USER_AGENT = "imoti.news scraper (+https://imoti.news)";
const URL = "https://www.imot.bg/sredni-ceni/prodazhbi-plovdiv";

// Table layout confirmed by direct inspection: one row per district, 8 cells
// -- [district, price1, ppsqm1, price2, ppsqm2, price3, ppsqm3, ppsqmOverall].
const PAIRED_TYPES = ["Едностаен", "Двустаен", "Тристаен"];

export async function scrapeImotBg(): Promise<RawPriceRow[]> {
  const res = await fetch(URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`imot.bg: HTTP ${res.status}`);

  const html = await res.text();
  const dom = new JSDOM(html);
  const table = dom.window.document.querySelector("table.sredni-ceni-2025") as HTMLTableElement | null;
  if (!table) throw new Error("imot.bg: price table not found (page layout may have changed)");

  const rows: RawPriceRow[] = [];

  for (let i = 2; i < table.rows.length; i++) {
    const cells = Array.from(table.rows[i].cells);
    if (cells.length < 8) continue;

    const district = cells[0]?.textContent?.trim();
    if (!district) continue;

    for (let g = 0; g < PAIRED_TYPES.length; g++) {
      const price = parseBgNumber(cells[1 + g * 2]?.textContent);
      const pricePerSqm = parseBgNumber(cells[2 + g * 2]?.textContent);
      if (price === null && pricePerSqm === null) continue;
      rows.push({ district, propertyType: PAIRED_TYPES[g], price, pricePerSqm, listingCount: null });
    }

    const overallPricePerSqm = parseBgNumber(cells[7]?.textContent);
    if (overallPricePerSqm !== null) {
      rows.push({ district, propertyType: "Общо", price: null, pricePerSqm: overallPricePerSqm, listingCount: null });
    }
  }

  return rows;
}
