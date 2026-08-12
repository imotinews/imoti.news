import Parser from "rss-parser";
import type { FeedItem } from "./types";

const parser = new Parser({
  headers: { "User-Agent": "imoti.news scraper (+https://imoti.news)" },
  timeout: 15000,
});

export async function fetchRssItems(feedUrl: string, limit = 10): Promise<FeedItem[]> {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? [])
    .filter((item) => item.link)
    .slice(0, limit)
    .map((item) => ({
      url: item.link as string,
      title: (item.title ?? "").trim(),
      publishedAt: item.isoDate ? new Date(item.isoDate) : null,
      summary: item.contentSnippet?.trim() || item.summary?.trim() || null,
    }));
}
