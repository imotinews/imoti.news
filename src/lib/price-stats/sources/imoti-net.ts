import { JSDOM } from "jsdom";
import { parseBgNumber } from "../parse-helpers";
import type { RawPriceRow } from "../types";

const USER_AGENT = "imoti.news scraper (+https://imoti.news)";
// city_id=2 is Plovdiv on imoti.net's own site; date must be a real calendar
// date (they don't fall back to "latest" without one).
const BASE_URL = "https://www.imoti.net/bg/sredni-ceni";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function scrapeImotiNet(): Promise<RawPriceRow[]> {
  const url = `${BASE_URL}?ad_type_id=2&city_id=2&region_id=0&currency_id=4&date=${todayIso()}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`imoti.net: HTTP ${res.status}`);

  const html = await res.text();
  const dom = new JSDOM(html);
  const table = dom.window.document.querySelector("table.stats") as HTMLTableElement | null;
  if (!table) throw new Error("imoti.net: price table not found (page layout may have changed)");

  // Row 0: "Район" (rowspan 2) followed by one <th colspan="2"> per property
  // type -- read the labels dynamically since imoti.net's exact type mix
  // isn't guaranteed to stay fixed the way imot.bg/alo.bg's is.
  const headerCells = Array.from(table.rows[0].cells);
  const propertyTypes = headerCells.slice(1).map((cell) => cell.textContent?.trim() ?? "");

  const rows: RawPriceRow[] = [];

  for (let i = 2; i < table.rows.length; i++) {
    const cells = Array.from(table.rows[i].cells);
    if (cells.length < 2) continue;

    const district = cells[0]?.textContent?.trim();
    if (!district) continue;

    for (let g = 0; g < propertyTypes.length; g++) {
      const price = parseBgNumber(cells[1 + g * 2]?.textContent);
      const pricePerSqm = parseBgNumber(cells[2 + g * 2]?.textContent);
      if (price === null && pricePerSqm === null) continue;
      rows.push({ district, propertyType: propertyTypes[g], price, pricePerSqm, listingCount: null });
    }
  }

  return rows;
}
