// Rewrites already-published AI articles with the universal writing pipeline:
// re-reads the original page, keeps only its facts, writes a new text from
// those facts, checks it, and stores the old text in legacy_content so the
// change can be undone. Rewritten articles go back to draft for a spot-check.
//
//   npx tsx scripts/rewrite-existing.ts --pilot        2 articles per source
//   npx tsx scripts/rewrite-existing.ts                every article from the restricted sources
//   npx tsx scripts/rewrite-existing.ts --also-stroitel  also Vestnik Stroitel
import { prisma } from "../src/lib/prisma";
import { extractArticleText } from "../src/lib/scraper/extract";
import { buildEvidence, universalRewrite } from "../src/lib/writing/pipeline";
import { overlapRatio } from "../src/lib/writing/checks";

const RESTRICTED_PREFIXES = ["Investor.bg", "Imoti.net", "Plovdiv24.bg", "Money.bg", "Bulgaria ON AIR"];

const pilot = process.argv.includes("--pilot");
const alsoStroitel = process.argv.includes("--also-stroitel");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const prefixes = alsoStroitel ? [...RESTRICTED_PREFIXES, "Вестник Строител"] : RESTRICTED_PREFIXES;

  let articles = await prisma.article.findMany({
    where: {
      status: "published",
      legacyContent: null,
      isCard: false,
      OR: prefixes.map((p) => ({ sourceName: { startsWith: p } })),
    },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  if (pilot) {
    const perSource = new Map<string, number>();
    articles = articles.filter((a) => {
      const n = perSource.get(a.sourceName) ?? 0;
      perSource.set(a.sourceName, n + 1);
      return n < 2;
    });
  }

  console.log(`To rewrite: ${articles.length}`);

  let ok = 0;
  let failed = 0;
  let viaOriginal = 0;
  let viaLegacy = 0;
  let measured = 0;
  let oldOverlapSum = 0;
  let newOverlapSum = 0;
  const failures: string[] = [];

  for (const [index, article] of articles.entries()) {
    const label = `[${index + 1}/${articles.length}] ${article.sourceName} | ${article.id}`;
    try {
      const original = await extractArticleText(article.originalUrl).catch(() => null);
      const contentType = article.category?.slug === "saveti-dizain" ? "lifestyle" : "real_estate";

      let inputText = original?.text ?? article.rewrittenContent;
      let usedOriginal = Boolean(original);
      let result;
      try {
        result = await universalRewrite({
          title: original?.title || article.title,
          text: inputText,
          sourceName: article.sourceName,
          contentType,
          skipRelevance: true,
        });
      } catch (firstError) {
        // The page gave too little text (video page, paywall stub): fall back
        // to the facts already in the published text.
        if (!usedOriginal || !(firstError as Error).message.includes("факти")) throw firstError;
        inputText = article.rewrittenContent;
        usedOriginal = false;
        result = await universalRewrite({
          title: article.title,
          text: inputText,
          sourceName: article.sourceName,
          contentType,
          skipRelevance: true,
        });
      }
      if (!result.relevant) throw new Error("не е релевантна");
      if (usedOriginal) viaOriginal += 1;
      else viaLegacy += 1;

      const oldOverlap = overlapRatio(inputText, article.rewrittenContent);
      const newOverlap = result.overlap ?? 0;

      await prisma.article.update({
        where: { id: article.id },
        data: {
          legacyContent: JSON.stringify({
            title: article.title,
            excerpt: article.excerpt,
            content: article.rewrittenContent,
          }),
          title: result.title,
          excerpt: result.excerpt,
          rewrittenContent: result.content,
          evidence: buildEvidence(result, {
            sourceUrl: article.originalUrl,
            sourceName: article.sourceName,
            fetchedFrom: usedOriginal ? "original" : "previous-text",
          }),
          status: "draft",
        },
      });

      ok += 1;
      if (usedOriginal) {
        measured += 1;
        oldOverlapSum += oldOverlap;
        newOverlapSum += newOverlap;
      }
      console.log(
        `${label} OK via ${usedOriginal ? "original" : "legacy"}  overlap ${(oldOverlap * 100).toFixed(0)}% -> ${(newOverlap * 100).toFixed(0)}%`
      );
    } catch (error) {
      failed += 1;
      const message = (error as Error).message.slice(0, 160);
      failures.push(`${label}: ${message}`);
      console.log(`${label} FAILED: ${message}`);
    }
    await sleep(1500);
  }

  console.log("\n=== SUMMARY ===");
  console.log(`rewritten: ${ok}, failed: ${failed} (from original page: ${viaOriginal}, from old text: ${viaLegacy})`);
  if (measured > 0) {
    console.log(
      `average 5-word overlap with the original (${measured} articles read from the original page): before ${((oldOverlapSum / measured) * 100).toFixed(1)}%, after ${((newOverlapSum / measured) * 100).toFixed(1)}%`
    );
  }
  failures.forEach((f) => console.log(f));
}

main()
  .catch((error) => console.error("FATAL:", error))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
