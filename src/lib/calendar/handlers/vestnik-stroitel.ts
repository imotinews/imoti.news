import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/article-helpers";
import { fetchWithTimeout } from "@/lib/scraper/fetch-with-timeout";
import { generateJson } from "@/lib/scraper/ai-json";
import type { HandlerResult } from "../schedule";

const LISTING_URL = "https://vestnikstroitel.bg/pdf_edition";
const USER_AGENT = "imoti.news scraper (+https://imoti.news)";
const SOURCE_NAME = "Вестник Строител";
const ISSUE_LINK =
  /https:\/\/vestnikstroitel\.bg\/pdf_edition\/vestnik-stroitel-broi-(\d+)-ot-(\d{4})-g[a-z0-9-]*/g;
const WEEKDAY = "(?:понеделник|вторник|сряда|четвъртък|петък|събота|неделя)";

type Issue = { number: number; year: number; url: string };

function latestIssue(html: string): Issue | null {
  let best: Issue | null = null;
  for (const match of html.matchAll(ISSUE_LINK)) {
    const issue = { number: Number(match[1]), year: Number(match[2]), url: match[0] };
    if (!best || issue.year > best.year || (issue.year === best.year && issue.number > best.number)) {
      best = issue;
    }
  }
  return best;
}

function normalizeWords(text: string): string[] {
  return text.toLowerCase().match(/[а-яa-z]{4,}/g) ?? [];
}

// The AI only reads the printed front page; a headline is kept only if nearly
// all of its words really appear on that page, so nothing can be invented.
function keepGroundedHeadlines(headlines: string[], pageText: string): string[] {
  const pageWords = new Set(normalizeWords(pageText));
  const kept: string[] = [];
  for (const raw of headlines) {
    const headline = raw.replace(/\s+/g, " ").trim();
    if (!headline || headline.length > 200 || kept.includes(headline)) continue;
    const words = normalizeWords(headline);
    if (words.length === 0) continue;
    const found = words.filter((word) => pageWords.has(word)).length;
    if (found / words.length >= 0.8) kept.push(headline);
  }
  return kept.slice(0, 4);
}

async function readFrontPage(pdfUrl: string): Promise<{ frontPage: string; printedDate: string | null }> {
  const response = await fetchWithTimeout(pdfUrl, { headers: { "User-Agent": USER_AGENT } }, 45000);
  if (!response.ok) throw new Error(`PDF: HTTP ${response.status}`);

  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await response.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: false });

  const firstPages = text.slice(0, 3).join(" ");
  const dateMatch = firstPages.match(new RegExp(`${WEEKDAY},\\s*(\\d{1,2})\\s+([а-я]+)\\s+(\\d{4})`, "i"));

  return {
    frontPage: (text[0] ?? "").replace(/-\s*\n\s*/g, "").replace(/\s+/g, " ").trim(),
    printedDate: dateMatch ? `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]} г.` : null,
  };
}

export async function runVestnikStroitelIssue(): Promise<HandlerResult> {
  const listing = await fetchWithTimeout(LISTING_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!listing.ok) return { status: "error", message: `Страницата с броевете: HTTP ${listing.status}` };

  const issue = latestIssue(await listing.text());
  if (!issue) return { status: "error", message: "Не намерих брой на страницата — структурата може да е променена." };

  const already = await prisma.scrapedUrl.findUnique({ where: { url: issue.url } });
  if (already) return { status: "nothing_new", message: `Брой ${issue.number} вече е обработен.` };

  const issuePage = await fetchWithTimeout(issue.url, { headers: { "User-Agent": USER_AGENT } });
  if (!issuePage.ok) return { status: "error", message: `Страницата на брой ${issue.number}: HTTP ${issuePage.status}` };
  const pdfHref = (await issuePage.text()).match(/href="([^"]+\.pdf)"/i)?.[1];
  if (!pdfHref) return { status: "error", message: `Брой ${issue.number}: няма линк към PDF.` };
  const pdfUrl = new URL(pdfHref, issue.url).toString();

  const { frontPage, printedDate } = await readFrontPage(pdfUrl);

  let headlines: string[] = [];
  let aiNote = "";
  try {
    const result = await generateJson<{ headlines?: string[] }>({
      system:
        "Получаваш текста на първата страница на седмичен вестник. Извлечи заглавията на водещите материали (най-много 4), точно както са отпечатани. Само заглавия: без цели абзаци, без имена на рубрики, без реклами. Ако заглавието започва с име и длъжност, последвани от цитат (например „Арх. Иван Шишков, министър на ...: ...“), включи и двете, за да е ясно кой го казва. Ако не си сигурен, върни по-малко. Не измисляй.",
      user: frontPage.slice(0, 3500),
      schema: {
        type: "object",
        properties: { headlines: { type: "array", items: { type: "string" } } },
        required: ["headlines"],
      },
    });
    headlines = keepGroundedHeadlines(result?.headlines ?? [], frontPage);
  } catch (error) {
    aiNote = ` (заглавията не бяха извлечени: ${(error as Error).message})`;
  }

  const title = `Излезе брой ${issue.number} на вестник „Строител“`;
  // printedDate already ends with "г.", which closes the sentence.
  const paragraphs = [
    `Излезе брой ${issue.number} на вестник „Строител“ — официалното издание на Камарата на строителите в България (КСБ)${printedDate ? `, с дата ${printedDate}` : "."}`,
  ];
  if (headlines.length > 0) {
    paragraphs.push(`На първа страница са: ${headlines.join("; ")}.`);
  }
  paragraphs.push(`Целият брой е достъпен в PDF формат на сайта на вестника: ${issue.url}`);

  const [source, category] = await Promise.all([
    prisma.source.findFirst({ where: { name: SOURCE_NAME }, select: { id: true } }),
    prisma.category.findUnique({ where: { slug: "stroitelstvo" } }),
  ]);

  const article = await prisma.article.create({
    data: {
      slug: await generateUniqueSlug(title),
      title,
      excerpt: "Седмичното издание на Камарата на строителите в България е публикувано в PDF формат.",
      rewrittenContent: paragraphs.join("\n"),
      originalUrl: issue.url,
      sourceName: SOURCE_NAME,
      sourceId: source?.id ?? null,
      categoryId: category?.id ?? null,
      status: "draft",
      aiGenerated: headlines.length > 0,
    },
  });

  await prisma.scrapedUrl.create({
    data: { url: issue.url, status: "created", title, sourceId: source?.id ?? null, articleId: article.id },
  });

  return {
    status: "created",
    message: `Чернова за брой ${issue.number}${printedDate ? ` (${printedDate})` : ""}, ${headlines.length} заглавия от първата страница${aiNote}.`,
    articleId: article.id,
  };
}
