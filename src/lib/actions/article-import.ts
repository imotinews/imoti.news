"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/article-helpers";
import { extractArticleText } from "@/lib/scraper/extract";
import { classifyAndRewrite } from "@/lib/scraper/rewrite";

export type ImportState = { error?: string; existingArticleId?: string };

// A hand-picked page can be a short announcement, unlike what the automatic
// scraper insists on.
const MANUAL_MIN_TEXT_LENGTH = 80;

function parseHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function bareHost(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

// Same pipeline the automatic scraper uses (extract -> AI rewrite -> draft),
// for one link the admin pastes in. The relevance gate is off (manual: true):
// event announcements and promo-style pages are exactly what the automatic
// run skips, and are the reason this exists.
export async function importArticleFromUrl(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }

  const url = parseHttpUrl(String(formData.get("url") ?? ""));
  if (!url) {
    return { error: "Въведи валиден линк, който започва с http:// или https://." };
  }
  const href = url.toString();
  const contentType = formData.get("contentType") === "lifestyle" ? "lifestyle" : "real_estate";
  const customSourceName = String(formData.get("sourceName") ?? "").trim();

  const [existingArticle, existingClaim, sources] = await Promise.all([
    prisma.article.findFirst({ where: { originalUrl: href }, select: { id: true } }),
    prisma.scrapedUrl.findUnique({ where: { url: href }, select: { articleId: true } }),
    prisma.source.findMany({ select: { id: true, name: true, url: true } }),
  ]);

  const duplicateId = existingArticle?.id ?? existingClaim?.articleId ?? undefined;
  if (duplicateId) {
    return { error: "От този линк вече има новина.", existingArticleId: duplicateId };
  }

  // Credit the site under the name of a configured source when the host matches
  // one (so filters and the "Източник" line stay consistent), else its domain.
  const host = bareHost(url.hostname);
  const matchedSource = sources.find((s) => {
    try {
      return bareHost(new URL(s.url).hostname) === host;
    } catch {
      return false;
    }
  });
  const sourceName = customSourceName || matchedSource?.name || host;

  let extracted;
  try {
    extracted = await extractArticleText(href, { minLength: MANUAL_MIN_TEXT_LENGTH });
  } catch (error) {
    return {
      error: `Страницата не може да бъде отворена (${(error as Error).message}). Провери линка или опитай пак.`,
    };
  }
  if (!extracted) {
    return {
      error:
        "Не успях да извлека текст от тази страница. Възможно е сайтът да блокира автоматичен достъп или текстът да се зарежда с JavaScript. Пробвай да копираш текста ръчно във формата по-долу.",
    };
  }

  let classification;
  try {
    classification = await classifyAndRewrite({
      title: extracted.title,
      text: extracted.text,
      sourceName,
      contentType,
      manual: true,
    });
  } catch (error) {
    return { error: `Грешка при преразказа с изкуствен интелект: ${(error as Error).message}` };
  }

  if (!classification.relevant) {
    return {
      error:
        "Изкуственият интелект не намери смислено съдържание за преразказ в тази страница. Провери дали линкът води към самата статия.",
    };
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
      originalUrl: href,
      sourceName,
      sourceId: matchedSource?.id ?? null,
      categoryId: category?.id ?? null,
      status: "draft",
      aiGenerated: true,
    },
  });

  // Claim the link so the automatic scraper never re-creates it later. If a
  // previous automatic run already skipped it (irrelevant / too old / error),
  // that row is updated to point at this article instead.
  await prisma.scrapedUrl.upsert({
    where: { url: href },
    create: {
      url: href,
      status: "created",
      title: extracted.title,
      sourceId: matchedSource?.id ?? null,
      articleId: article.id,
    },
    update: { status: "created", articleId: article.id, errorMessage: null },
  });

  revalidatePath("/admin/articles");
  revalidatePath("/admin", "layout");

  redirect(`/admin/articles/${article.id}/edit`);
}
