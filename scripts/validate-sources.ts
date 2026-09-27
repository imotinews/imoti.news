// Read-only check of every feed URL in config/sources.json -- HTTP status,
// item count, newest item date, whether the feed carries full content, and
// whether robots.txt allows fetching it. Writes scripts/validate-report.json.
// Does NOT touch the database and does NOT add anything to the live
// scraper -- this is only meant to tell us which of the proposed sources
// are actually real before anyone decides whether to wire them in.
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import Parser from "rss-parser";
import { robotsAllows } from "../src/lib/scraper/robots";
import { fetchWithTimeout } from "../src/lib/scraper/fetch-with-timeout";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type SourceEntry = {
  id: string;
  name: string;
  feed_url: string | null;
  feed_type: string;
  content_mode: string;
};

type SourcesFile = { sources: SourceEntry[] };

type ValidateResult = {
  id: string;
  name: string;
  feedUrl: string | null;
  httpStatus: number | null;
  ok: boolean;
  itemCount: number | null;
  newestItemDate: string | null;
  hasFullContent: boolean | null;
  robotsAllowed: boolean | null;
  error: string | null;
};

const parser = new Parser({
  headers: { "User-Agent": BROWSER_USER_AGENT },
  timeout: 15000,
  customFields: { item: ["content:encoded"] },
});

async function validateOne(source: SourceEntry): Promise<ValidateResult> {
  const result: ValidateResult = {
    id: source.id,
    name: source.name,
    feedUrl: source.feed_url,
    httpStatus: null,
    ok: false,
    itemCount: null,
    newestItemDate: null,
    hasFullContent: null,
    robotsAllowed: null,
    error: null,
  };

  if (!source.feed_url) {
    result.error = "no feed_url -- html-only source, needs a list-page parser, not this script";
    return result;
  }

  try {
    result.robotsAllowed = await robotsAllows(source.feed_url);
  } catch {
    result.robotsAllowed = null;
  }

  try {
    const response = await fetchWithTimeout(
      source.feed_url,
      { headers: { "User-Agent": BROWSER_USER_AGENT }, redirect: "follow" },
      15000
    );
    result.httpStatus = response.status;

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    const items = feed.items ?? [];
    result.itemCount = items.length;

    const dates = items
      .map((item) => (item.isoDate ? new Date(item.isoDate) : null))
      .filter((d): d is Date => d !== null && !Number.isNaN(d.getTime()));
    result.newestItemDate = dates.length
      ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString()
      : null;

    result.hasFullContent = items.some((item) => {
      const encoded = (item as unknown as Record<string, unknown>)["content:encoded"];
      const snippetLength = item.contentSnippet?.length ?? 0;
      return typeof encoded === "string" && encoded.trim().length > snippetLength + 200;
    });

    result.ok = true;
  } catch (err) {
    result.error = (err as Error).message;
  }

  return result;
}

async function main() {
  const configPath = resolve(process.cwd(), "config/sources.json");
  const data: SourcesFile = JSON.parse(readFileSync(configPath, "utf-8"));

  const results: ValidateResult[] = [];
  for (const source of data.sources) {
    const result = await validateOne(source);
    results.push(result);

    const label = result.ok ? "OK  " : "FAIL";
    const robots =
      result.robotsAllowed === null ? "?" : result.robotsAllowed ? "allow" : "DENY";
    console.log(
      `${label} ${source.id.padEnd(24)} status=${result.httpStatus ?? "-"} items=${result.itemCount ?? "-"} full=${result.hasFullContent ?? "-"} newest=${result.newestItemDate?.slice(0, 10) ?? "-"} robots=${robots} ${result.error ?? ""}`
    );
  }

  const reportPath = resolve(process.cwd(), "scripts/validate-report.json");
  writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf-8");

  const okCount = results.filter((r) => r.ok).length;
  const skipped = results.filter((r) => r.error?.startsWith("no feed_url")).length;
  console.log(`\n${okCount}/${results.length} feeds OK, ${skipped} skipped (html-only, no feed).`);
  console.log(`Report written to ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
