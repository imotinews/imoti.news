import { JSDOM } from "jsdom";
import { fetchWithTimeout } from "./fetch-with-timeout";
import type { FeedItem } from "./types";

const USER_AGENT = "imoti.news scraper (+https://imoti.news)";

const SKIP_PATH_PATTERNS = [
  "/tag/",
  "/tags/",
  "/category/",
  "/author/",
  "/search",
  "/login",
  "/register",
  "/contact",
  "/about",
  "/rss",
  "javascript:",
  "mailto:",
];

function looksLikeArticleLink(href: string, baseOrigin: string): boolean {
  let url: URL;
  try {
    url = new URL(href, baseOrigin);
  } catch {
    return false;
  }

  if (url.origin !== baseOrigin) return false;
  const path = url.pathname.toLowerCase();
  if (path === "/" || path === "") return false;
  if (SKIP_PATH_PATTERNS.some((pattern) => path.includes(pattern))) return false;

  const hasDigitId = /\d{3,}/.test(path);
  const hasMultipleSegments = path.split("/").filter(Boolean).length >= 2;

  return hasDigitId || hasMultipleSegments;
}

export async function fetchListingLinks(listingUrl: string, limit = 10): Promise<FeedItem[]> {
  const response = await fetchWithTimeout(listingUrl, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch listing page: ${response.status}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url: listingUrl });
  const baseOrigin = new URL(listingUrl).origin;

  const seen = new Set<string>();
  const items: FeedItem[] = [];

  for (const anchor of Array.from(dom.window.document.querySelectorAll("a[href]"))) {
    const href = anchor.getAttribute("href");
    if (!href) continue;
    if (!looksLikeArticleLink(href, baseOrigin)) continue;

    const url = new URL(href, baseOrigin).toString();
    if (seen.has(url)) continue;

    const title = anchor.textContent?.trim();
    if (!title || title.length < 10) continue;

    seen.add(url);
    items.push({ url, title, publishedAt: null, summary: null });

    if (items.length >= limit) break;
  }

  return items;
}
