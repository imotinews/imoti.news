import Parser from "rss-parser";
import { waitForDomainSlot } from "./fetch-with-timeout";
import type { FeedItem } from "./types";

// Some feeds (e.g. vestnikstroitel.bg) skip the standard <link> tag entirely
// and put the article URL in a non-standard <url> tag instead. rss-parser
// only recognizes <link> by default, so we pull <url> in as a custom field
// and fall back to it when <link> is missing.
type CustomItem = { url?: string };

const parser: Parser<object, CustomItem> = new Parser({
  headers: { "User-Agent": "imoti.news scraper (+https://imoti.news)" },
  timeout: 15000,
  customFields: {
    item: ["url"],
  },
});

export async function fetchRssItems(feedUrl: string, limit = 10): Promise<FeedItem[]> {
  await waitForDomainSlot(feedUrl);
  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? [])
    .map((item) => ({ ...item, resolvedUrl: item.link || item.url }))
    .filter((item) => item.resolvedUrl)
    .slice(0, limit)
    .map((item) => ({
      url: item.resolvedUrl as string,
      title: (item.title ?? "").trim(),
      publishedAt: item.isoDate ? new Date(item.isoDate) : null,
      summary: item.contentSnippet?.trim() || item.summary?.trim() || null,
    }));
}
