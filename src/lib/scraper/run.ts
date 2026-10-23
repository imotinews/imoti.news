import { Prisma, type Source } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/article-helpers";
import { fetchRssItems } from "./rss";
import { fetchListingLinks } from "./html";
import { extractArticleText } from "./extract";
import { classifyAndRewrite } from "./rewrite";
import { buildEvidence, universalRewrite } from "@/lib/writing/pipeline";
import { findSimilarTitle } from "./dedup";
import type { ScraperRunResult } from "./types";

// Lowered from 8 now that the source count has roughly doubled -- at 4.5s
// of mandatory AI-rate-limit delay per item, 23 sources x 8 items already
// guarantees over 13 minutes of pure waiting before any fetch/AI time, well
// past what a single serverless invocation can safely finish within.
const MAX_ITEMS_PER_SOURCE = 5;
const RECENT_TITLES_WINDOW_DAYS = 5;

// This is a news site -- an item published months ago (some listing pages
// mix in old/evergreen articles with no date of their own) shouldn't be
// scraped as if it were today's news.
const MAX_ARTICLE_AGE_DAYS = 3;

// Gemini's free tier caps at 15 requests/minute for gemini-3.5-flash-lite.
// Spacing calls out avoids burning through the quota mid-run.
const AI_CALL_DELAY_MS = 4500;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTooOld(date: Date | null): boolean {
  if (!date || Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000;
}

async function touchRun(runId: string | undefined, data: Record<string, unknown>) {
  if (!runId) return;
  await prisma.scrapeRun.update({ where: { id: runId }, data }).catch(() => {});
}

async function getRecentTitles(): Promise<string[]> {
  const windowStart = new Date(Date.now() - RECENT_TITLES_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recentArticles = await prisma.article.findMany({
    where: { createdAt: { gte: windowStart } },
    select: { title: true },
  });
  return recentArticles.map((a) => a.title);
}

// Card and signal sources only ever read the feed itself (title + the excerpt
// the source chose to publish), so scanning more items per run costs nothing.
const MAX_LIGHT_ITEMS_PER_SOURCE = 30;
const MAX_CARD_AI_CALLS_PER_SOURCE = 5;
const CARD_MAX_CHARS = 500;

// Free pre-filter for feeds of general news sites, where most items have
// nothing to do with property -- keeps the AI relevance call for plausible
// items only, and drives the radar in signal mode.
const PROPERTY_KEYWORDS = [
  "имот", "жилищ", "апартамент", "строителств", "строеж", "строител", "ипотек",
  "недвижим", "квартир", "наем", "новострой", "сграда", "сгради", "кадастър",
  "вписван", "данъчна оценка", "етажна собственост", "устройствен", "урбанист",
  "инвестиционен проект", "офис сграда", "лихв", "жилищен кредит",
];

function looksPropertyRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return PROPERTY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function cutSnippet(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= CARD_MAX_CHARS) return clean;
  const cut = clean.slice(0, CARD_MAX_CHARS);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 200 ? cut.lastIndexOf(" ") : CARD_MAX_CHARS)}…`;
}

// "card" publishes the source's own title and excerpt exactly as its feed
// provides them (name and link are shown with it); "signal" publishes nothing
// and only feeds the admin radar. Neither fetches the article page or asks AI
// to write a single sentence.
async function processLightSource(source: Source, recentTitles: string[]): Promise<ScraperRunResult> {
  const result: ScraperRunResult = {
    sourceId: source.id,
    sourceName: source.name,
    itemsSeen: 0,
    created: 0,
    skippedIrrelevant: 0,
    skippedDuplicate: 0,
    skippedSimilar: 0,
    skippedTooOld: 0,
    errors: [],
  };

  try {
    if (source.type !== "rss" && source.mode === "card") {
      throw new Error("Режимът „карта“ работи само с RSS емисия (нужен е откъсът от самата емисия).");
    }

    const items =
      source.type === "rss"
        ? await fetchRssItems(source.url, MAX_LIGHT_ITEMS_PER_SOURCE)
        : await fetchListingLinks(source.url, MAX_LIGHT_ITEMS_PER_SOURCE);
    result.itemsSeen = items.length;
    let aiCalls = 0;

    for (const item of items) {
      if (source.mode === "card" && aiCalls >= MAX_CARD_AI_CALLS_PER_SOURCE) break;

      let claimId: string;
      try {
        const claimed = await prisma.scrapedUrl.create({
          data: { url: item.url, status: "error", title: item.title, sourceId: source.id },
        });
        claimId = claimed.id;
      } catch (claimError) {
        if (isUniqueConstraintError(claimError)) {
          result.skippedDuplicate += 1;
          continue;
        }
        throw claimError;
      }

      try {
        if (isTooOld(item.publishedAt)) {
          result.skippedTooOld += 1;
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: {
              status: "too_old",
              errorMessage: `Публикувана на ${item.publishedAt?.toISOString().slice(0, 10)}`,
            },
          });
          continue;
        }

        const snippet = item.summary ? cutSnippet(item.summary) : "";

        if (!looksPropertyRelated(`${item.title} ${snippet}`)) {
          result.skippedIrrelevant += 1;
          await prisma.scrapedUrl.update({ where: { id: claimId }, data: { status: "irrelevant" } });
          continue;
        }

        if (source.mode === "signal") {
          await prisma.scrapedUrl.update({ where: { id: claimId }, data: { status: "signal" } });
          continue;
        }

        const similarTitle = findSimilarTitle(item.title, recentTitles);
        if (similarTitle) {
          result.skippedSimilar += 1;
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: { status: "similar_duplicate", errorMessage: `Прилича на: ${similarTitle}` },
          });
          continue;
        }

        if (!snippet) {
          result.errors.push(`Няма откъс в емисията: ${item.url}`);
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: { status: "error", errorMessage: "Няма откъс в емисията" },
          });
          continue;
        }

        await sleep(AI_CALL_DELAY_MS);
        aiCalls += 1;

        const classification = await classifyAndRewrite({
          title: item.title,
          text: snippet,
          sourceName: source.name,
          contentType: source.contentType,
          cardOnly: true,
        });

        if (!classification.relevant) {
          result.skippedIrrelevant += 1;
          await prisma.scrapedUrl.update({ where: { id: claimId }, data: { status: "irrelevant" } });
          continue;
        }

        const categorySlug = source.forceCategorySlug ?? classification.categorySlug;
        const category = categorySlug
          ? await prisma.category.findUnique({ where: { slug: categorySlug } })
          : null;

        const article = await prisma.article.create({
          data: {
            slug: await generateUniqueSlug(item.title),
            title: item.title,
            excerpt: snippet,
            rewrittenContent: snippet,
            originalUrl: item.url,
            sourceName: source.name,
            sourceId: source.id,
            sourceAuthor: item.author ?? null,
            categoryId: category?.id ?? null,
            status: "draft",
            aiGenerated: false,
            isCard: true,
          },
        });

        recentTitles.push(item.title);
        result.created += 1;
        await prisma.scrapedUrl.update({
          where: { id: claimId },
          data: { status: "created", articleId: article.id },
        });
      } catch (itemError) {
        const message = (itemError as Error).message;
        result.errors.push(`${item.url}: ${message}`);
        console.error(`[scraper] card item error (${item.url}):`, itemError);
        await prisma.scrapedUrl
          .update({ where: { id: claimId }, data: { status: "error", errorMessage: message } })
          .catch(() => {});
      }
    }
  } catch (sourceError) {
    result.errors.push(`Грешка при извличане от източника: ${(sourceError as Error).message}`);
    console.error(`[scraper] source error (${source.name}):`, sourceError);
  }

  await prisma.source.update({ where: { id: source.id }, data: { lastCheckedAt: new Date() } }).catch(() => {});

  return result;
}

// Processes a single source end to end (fetch its listing/feed, extract,
// classify+rewrite, create articles) and returns a summary. Shared by both
// the full scheduled run (every active source) and a single-source manual
// "check now" run -- recentTitles is threaded through by the caller so a
// manual check still benefits from the same cross-source similarity dedup.
async function processSource(source: Source, recentTitles: string[]): Promise<ScraperRunResult> {
  if (source.mode !== "rewrite") {
    return processLightSource(source, recentTitles);
  }

  const result: ScraperRunResult = {
    sourceId: source.id,
    sourceName: source.name,
    itemsSeen: 0,
    created: 0,
    skippedIrrelevant: 0,
    skippedDuplicate: 0,
    skippedSimilar: 0,
    skippedTooOld: 0,
    errors: [],
  };

  try {
    const items =
      source.type === "rss"
        ? await fetchRssItems(source.url, MAX_ITEMS_PER_SOURCE)
        : await fetchListingLinks(source.url, MAX_ITEMS_PER_SOURCE);

    result.itemsSeen = items.length;

    for (const item of items) {
      // Claimed pessimistically as "error" first — if anything below
      // throws unexpectedly, the record still honestly reflects that,
      // instead of silently looking like a normal skip.
      let claimId: string;
      try {
        const claimed = await prisma.scrapedUrl.create({
          data: {
            url: item.url,
            status: "error",
            title: item.title,
            sourceId: source.id,
          },
        });
        claimId = claimed.id;
      } catch (claimError) {
        if (isUniqueConstraintError(claimError)) {
          result.skippedDuplicate += 1;
          continue;
        }
        throw claimError;
      }

      try {
        if (isTooOld(item.publishedAt)) {
          result.skippedTooOld += 1;
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: {
              status: "too_old",
              errorMessage: `Публикувана на ${item.publishedAt?.toISOString().slice(0, 10)}`,
            },
          });
          continue;
        }

        const similarTitle = findSimilarTitle(item.title, recentTitles);
        if (similarTitle) {
          result.skippedSimilar += 1;
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: { status: "similar_duplicate", errorMessage: `Прилича на: ${similarTitle}` },
          });
          continue;
        }

        const extracted = await extractArticleText(item.url);
        if (!extracted) {
          const message = "Извличането на текста се провали";
          result.errors.push(`${message}: ${item.url}`);
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: { status: "error", errorMessage: message },
          });
          continue;
        }

        // Listing-scraped sources (as opposed to RSS) have no date of
        // their own -- fall back to whatever the article page's metadata
        // says, since that's the only freshness signal we have for them.
        if (!item.publishedAt && isTooOld(extracted.publishedAt)) {
          result.skippedTooOld += 1;
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: {
              status: "too_old",
              errorMessage: `Публикувана на ${extracted.publishedAt?.toISOString().slice(0, 10)}`,
            },
          });
          continue;
        }

        await sleep(AI_CALL_DELAY_MS);

        const classification = await universalRewrite({
          title: extracted.title || item.title,
          text: extracted.text,
          sourceName: source.name,
          contentType: source.contentType,
        });

        if (!classification.relevant) {
          result.skippedIrrelevant += 1;
          await prisma.scrapedUrl.update({
            where: { id: claimId },
            data: { status: "irrelevant" },
          });
          continue;
        }

        const categorySlug = source.forceCategorySlug ?? classification.categorySlug;
        const category = categorySlug
          ? await prisma.category.findUnique({ where: { slug: categorySlug } })
          : null;

        const slug = await generateUniqueSlug(classification.title);

        const article = await prisma.article.create({
          data: {
            slug,
            title: classification.title,
            excerpt: classification.excerpt || null,
            rewrittenContent: classification.content,
            originalUrl: item.url,
            sourceName: source.name,
            sourceId: source.id,
            categoryId: category?.id ?? null,
            status: "draft",
            aiGenerated: true,
            evidence: buildEvidence(classification, {
              sourceUrl: item.url,
              sourceName: source.name,
              fetchedFrom: "original",
            }),
          },
        });

        recentTitles.push(classification.title);
        result.created += 1;

        await prisma.scrapedUrl.update({
          where: { id: claimId },
          data: { status: "created", articleId: article.id },
        });
      } catch (itemError) {
        const message = (itemError as Error).message;
        result.errors.push(`${item.url}: ${message}`);
        console.error(`[scraper] item error (${item.url}):`, itemError);
        await prisma.scrapedUrl
          .update({ where: { id: claimId }, data: { status: "error", errorMessage: message } })
          .catch(() => {});
      }
    }
  } catch (sourceError) {
    result.errors.push(`Грешка при извличане от източника: ${(sourceError as Error).message}`);
    console.error(`[scraper] source error (${source.name}):`, sourceError);
  }

  // Always stamped, whether or not anything new was found -- otherwise a
  // healthy source whose feed has no new items ever looks untouched, since
  // the admin UI's "last attempt" used to be derived only from newly
  // created scraped_urls rows.
  await prisma.source.update({ where: { id: source.id }, data: { lastCheckedAt: new Date() } }).catch(() => {});

  return result;
}

export async function runScraper(runId?: string): Promise<ScraperRunResult[]> {
  try {
    return await runScraperInner(runId);
  } catch (error) {
    await touchRun(runId, { status: "failed", finishedAt: new Date() });
    throw error;
  }
}

async function runScraperInner(runId?: string): Promise<ScraperRunResult[]> {
  const sources = await prisma.source.findMany({ where: { active: true } });
  const results: ScraperRunResult[] = [];

  await touchRun(runId, { totalSources: sources.length });

  // Grows across the whole run (not just per source) so two sources reporting
  // the same story in the same run also get caught, not just against history.
  const recentTitles = await getRecentTitles();

  for (const source of sources) {
    await touchRun(runId, { currentSourceName: source.name });

    const result = await processSource(source, recentTitles);

    await touchRun(runId, {
      sourcesDone: { increment: 1 },
      itemsSeen: { increment: result.itemsSeen },
      created: { increment: result.created },
      errors: { increment: result.errors.length },
    });

    results.push(result);
  }

  await touchRun(runId, { status: "completed", finishedAt: new Date(), currentSourceName: null });

  return results;
}

// Manual "check now" for exactly one source -- independent of the scheduled
// full run. Doesn't skip the source from future full runs: URL-level dedup
// (scraped_urls' unique constraint) already prevents re-creating anything
// this run picks up, the same way it already prevents cross-run duplicates.
export async function runScraperForSource(sourceId: string, runId?: string): Promise<ScraperRunResult> {
  try {
    const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });

    await touchRun(runId, { totalSources: 1, currentSourceName: source.name });

    const recentTitles = await getRecentTitles();
    const result = await processSource(source, recentTitles);

    await touchRun(runId, {
      sourcesDone: 1,
      itemsSeen: result.itemsSeen,
      created: result.created,
      errors: result.errors.length,
      status: "completed",
      finishedAt: new Date(),
      currentSourceName: null,
    });

    return result;
  } catch (error) {
    await touchRun(runId, { status: "failed", finishedAt: new Date() });
    throw error;
  }
}
