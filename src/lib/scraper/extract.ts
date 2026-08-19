import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { fetchWithTimeout } from "./fetch-with-timeout";
import type { ExtractedArticle } from "./types";

const USER_AGENT = "imoti.news scraper (+https://imoti.news)";

export async function extractArticleText(pageUrl: string): Promise<ExtractedArticle | null> {
  const response = await fetchWithTimeout(pageUrl, {
    headers: { "User-Agent": USER_AGENT },
  });

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
  if (text.length < 200) {
    return null;
  }

  const publishedAt = parsed.publishedTime ? new Date(parsed.publishedTime) : null;

  return {
    title: parsed.title?.trim() || "",
    text,
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  };
}
