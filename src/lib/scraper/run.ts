import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/article-helpers";
import { fetchRssItems } from "./rss";
import { fetchListingLinks } from "./html";
import { extractArticleText } from "./extract";
import { classifyAndRewrite } from "./rewrite";
import type { ScraperRunResult } from "./types";

const MAX_ITEMS_PER_SOURCE = 8;

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

  for (const source of sources) {
    const result: ScraperRunResult = {
      sourceId: source.id,
      sourceName: source.name,
      itemsSeen: 0,
      created: 0,
      skippedIrrelevant: 0,
      skippedDuplicate: 0,
      errors: [],
    };

    try {
      const items =
        source.type === "rss"
          ? await fetchRssItems(source.url, MAX_ITEMS_PER_SOURCE)
          : await fetchListingLinks(source.url, MAX_ITEMS_PER_SOURCE);

      result.itemsSeen = items.length;

      for (const item of items) {
        try {
          // Atomically claim this URL before doing any work — the unique
          // constraint on `url` is what actually prevents two concurrent
          // runs (or a double-click) from both processing the same item.
          try {
            await prisma.scrapedUrl.create({ data: { url: item.url } });
          } catch (claimError) {
            if (isUniqueConstraintError(claimError)) {
              result.skippedDuplicate += 1;
              continue;
            }
            throw claimError;
          }

          const extracted = await extractArticleText(item.url);
          if (!extracted) {
            result.errors.push(`Извличането на текста се провали: ${item.url}`);
            continue;
          }

          await sleep(AI_CALL_DELAY_MS);

          const classification = await classifyAndRewrite({
            title: extracted.title || item.title,
            text: extracted.text,
            sourceName: source.name,
          });

          if (!classification.relevant) {
            result.skippedIrrelevant += 1;
            continue;
          }

          const category = classification.categorySlug
            ? await prisma.category.findUnique({ where: { slug: classification.categorySlug } })
            : null;

          const slug = await generateUniqueSlug(classification.title);

          await prisma.article.create({
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

          result.created += 1;
        } catch (itemError) {
          result.errors.push(`${item.url}: ${(itemError as Error).message}`);
          console.error(`[scraper] item error (${item.url}):`, itemError);
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
