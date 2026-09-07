import { JSDOM } from "jsdom";
import { parseBgNumber } from "../parse-helpers";
import type { RawPriceRow } from "../types";

const USER_AGENT = "imoti.news scraper (+https://imoti.news)";
// region_id=16 / location_ids=3333 is Plovdiv on alo.bg's own site.
const URL = "https://www.alo.bg/sredni_ceni/imoti-prodajbi/apartamenti-stai/?region_id=16&location_ids=3333";

// Each data row carries its numbers as plain HTML attributes (t1_price,
// t1_price_per, ...) rather than formatted cell text -- much sturdier to
// parse than the other two sites, no column-position guessing needed.
const TYPE_PREFIXES: Record<string, string> = {
  t1: "Едностаен апартамент",
  t2: "Двустаен апартамент",
  t3: "Тристаен апартамент",
  t4: "Многостаен апартамент",
  t35: "Ателие/Студио",
};

export async function scrapeAloBg(): Promise<RawPriceRow[]> {
  const res = await fetch(URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`alo.bg: HTTP ${res.status}`);

  const html = await res.text();
  const dom = new JSDOM(html);
  const dataRows = dom.window.document.querySelectorAll("tr.data_row") as unknown as HTMLElement[];
  if (dataRows.length === 0) throw new Error("alo.bg: no data rows found (page layout may have changed)");

  const rows: RawPriceRow[] = [];

  for (const row of Array.from(dataRows)) {
    const district = row.getAttribute("section_name")?.trim();
    if (!district) continue;

    for (const [prefix, propertyType] of Object.entries(TYPE_PREFIXES)) {
      // alo.bg's attributes use 0.00 as its own "no data" sentinel (the
      // visible cell is just blank) rather than omitting the attribute --
      // a real listing is never priced at exactly 0, so treat it as missing.
      const price = parseBgNumber(row.getAttribute(`${prefix}_price`)) || null;
      const pricePerSqm = parseBgNumber(row.getAttribute(`${prefix}_price_per`)) || null;
      if (price === null && pricePerSqm === null) continue;
      rows.push({ district, propertyType, price, pricePerSqm, listingCount: null });
    }
  }

  return rows;
}
