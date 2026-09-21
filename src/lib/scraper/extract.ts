import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { fetchWithTimeout } from "./fetch-with-timeout";
import { robotsAllows } from "./robots";
import type { ExtractedArticle } from "./types";

const USER_AGENT = "imoti.news scraper (+https://imoti.news)";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Short event/promo announcements are legitimately brief, so the hand-import
// path passes a lower minimum than the automatic scraper's 200 characters.
const DEFAULT_MIN_TEXT_LENGTH = 200;

export async function extractArticleText(
  pageUrl: string,
  options: { minLength?: number; browserFallback?: boolean } = {}
): Promise<ExtractedArticle | null> {
  const minLength = options.minLength ?? DEFAULT_MIN_TEXT_LENGTH;
  let response = await fetchWithTimeout(pageUrl, {
    headers: { "User-Agent": USER_AGENT },
  });

  // Some sites answer 403 to any User-Agent they don't recognise even though
  // their robots.txt allows crawling. For a single link the admin deliberately
  // pasted, retry once the way a normal browser would -- but only when
  // robots.txt permits the page. Never used by the automatic scraper.
  if (response.status === 403 && options.browserFallback && (await robotsAllows(pageUrl))) {
    response = await fetchWithTimeout(pageUrl, {
      headers: { "User-Agent": BROWSER_USER_AGENT, "Accept-Language": "bg,en;q=0.8" },
    });
  }

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url: pageUrl });
  const reader = new Readability(dom.window.document);
  const parsed = reader.parse();

  if (!parsed?.textContent) {
    return null;
  }

  const text = parsed.textContent.replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < minLength) {
    return null;
  }

  const publishedAt = parsed.publishedTime ? new Date(parsed.publishedTime) : null;

  return {
    title: parsed.title?.trim() || "",
    text,
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  };
}
