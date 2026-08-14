import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/article-helpers";
import { fetchRssItems } from "./rss";
import { fetchListingLinks } from "./html";
import { extractArticleText } from "./extract";
import { classifyAndRewrite } from "./rewrite";
import { findSimilarTitle } from "./dedup";
import type { ScraperRunResult } from "./types";

const MAX_ITEMS_PER_SOURCE = 8;
const RECENT_TITLES_WINDOW_DAYS = 5;

// Gemini's free tier caps at 15 requests/minute for gemini-3.5-flash-lite.
// Spacing calls out avoids burning through the quota mid-run.
const AI_CALL_DELAY_MS = 4500;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runScraper(): Promise<ScraperRunResult[]> {
  const sources = await prisma.source.findMany({ where: { active: true } });
  const results: ScraperRunResult[] = [];

  const windowStart = new Date(Date.now() - RECENT_TITLES_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recentArticles = await prisma.article.findMany({
    where: { createdAt: { gte: windowStart } },
    select: { title: true },
  });
  // Grows across the whole run (not just per source) so two sources reporting
  // the same story in the same run also get caught, not just against history.
  const recentTitles = recentArticles.map((a) => a.title);

  for (const source of sources) {
    const result: ScraperRunResult = {
      sourceId: source.id,
      sourceName: source.name,
      itemsSeen: 0,
      created: 0,
      skippedIrrelevant: 0,
      skippedDuplicate: 0,
      skippedSimilar: 0,
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

          await sleep(AI_CALL_DELAY_MS);

          const classification = await classifyAndRewrite({
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

          const category = classification.categorySlug
            ? await prisma.category.findUnique({ where: { slug: classification.categorySlug } })
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

    results.push(result);
  }

  return results;
}
