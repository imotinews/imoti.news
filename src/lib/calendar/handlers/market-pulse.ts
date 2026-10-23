import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/article-helpers";
import { generateJson } from "@/lib/scraper/ai-json";
import { buildEvidencePack, type EvidencePack } from "../evidence";
import type { HandlerResult } from "../schedule";

const SOURCE_NAME = "Imoti.news Market Watch";
const NUMBER_PATTERN = /\d+(?:[  ]\d{3})*(?:[.,]\d+)?/g;

const SYSTEM_PROMPT = `Ти си редактор на imoti.news. Пишеш кратък анализ на български САМО от подадения JSON с доказателства. Нищо друго не е позволено.

1. Заглавие (title): използвай titleHint точно или само с промяна на реда на думите.
2. Първият абзац започва точно така: „Проверка на Imoti.news“, после стойността на leadPhrase, после „показва, че офертните цени на двустайните апартаменти в Пловдив“, после verdictPhrase, после periodText (периодът се споменава само тук и не се повтаря никъде другаде). Можеш да добавиш едно изречение за броя на кварталите (districts на всяка серия).
3. Вторият абзац описва всеки портал с едно изречение: средната цена в началото и в края (firstText, lastText, „евро на кв. м“) като изречението завършва с тире и точно думите от changeWords (например „... 1 644 евро на кв. м — спад от 1,6%“). Не пиши знак минус. После, по желание, едно изречение за разликата между порталите със gapText.
4. Третият абзац започва с „Какво означава това.“ и казва само, че офертните цени не са цените, по които се сключват сделките, и че тези данни не показват как се развиват продажбите.
5. Числата вземай ТОЧНО както са дадени в полетата Text и Words. Не закръглявай, не изчислявай нови числа, не използвай никакви други числа освен тях и броя на кварталите (districts).
6. Не назовавай порталите по име. Пиши „в единия портал“ и „в другия“ (при три портала „в първия“, „във втория“, „в третия“).
7. Без прогнози, причини, цитати, чужди мнения и без нищо, което не е в JSON. Никога не пиши „потвърждава се“.
8. Тон: делови и спокоен, кратки изречения.
Върни: title, excerpt (1-2 изречения) и paragraphs (точно 3 абзаца).`;

function normalizeNumber(token: string): string {
  return token.replace(/[  ]/g, "").replace(",", ".").replace(/^0+(?=\d)/, "");
}

function extractNumbers(text: string): string[] {
  return (text.match(NUMBER_PATTERN) ?? []).map(normalizeNumber);
}

function collectAllowed(value: unknown, into: Set<string>): void {
  if (typeof value === "string") {
    extractNumbers(value).forEach((n) => into.add(n));
  } else if (typeof value === "number") {
    into.add(normalizeNumber(String(Math.abs(value))));
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectAllowed(v, into));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectAllowed(v, into));
  }
}

type Draft = { title: string; excerpt: string; paragraphs: string[] };

async function writeDraft(
  pack: Omit<EvidencePack, "methodology" | "toDate">
): Promise<Draft | { error: string }> {
  const allowed = new Set<string>();
  collectAllowed(pack, allowed);

  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const draft = await generateJson<Draft>({
      system: SYSTEM_PROMPT,
      user: `${JSON.stringify(pack, null, 2)}${feedback}`,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          excerpt: { type: "string" },
          paragraphs: { type: "array", items: { type: "string" } },
        },
        required: ["title", "excerpt", "paragraphs"],
      },
    });

    if (!draft?.title || !draft.excerpt || !Array.isArray(draft.paragraphs) || draft.paragraphs.length < 2) {
      feedback = "\n\nПредишният отговор беше непълен. Върни title, excerpt и paragraphs.";
      continue;
    }

    const text = [draft.title, draft.excerpt, ...draft.paragraphs].join("\n");
    const unknown = [...new Set(extractNumbers(text).filter((n) => !allowed.has(n)))];
    const startsRight = draft.paragraphs[0].startsWith(`Проверка на Imoti.news ${pack.leadPhrase}`);

    if (unknown.length === 0 && startsRight) return draft;

    feedback = `\n\nПредишният отговор беше отхвърлен: ${
      unknown.length > 0 ? `използвани са числа, които не са в JSON (${unknown.join(", ")}). ` : ""
    }${startsRight ? "" : `Първото изречение трябва да започва точно с „Проверка на Imoti.news ${pack.leadPhrase}“. `}Поправи го.`;
  }

  return { error: `Проверката на числата отхвърли текста два пъти${feedback ? ` (${feedback.trim().slice(0, 160)})` : ""}.` };
}

export async function runMarketPulse(): Promise<HandlerResult> {
  const fullPack = await buildEvidencePack();
  if (!fullPack) {
    return { status: "nothing_new", message: "Недостатъчно надеждни данни (нужни са поне 2 портала и 3 седмици)." };
  }

  const claimUrl = `https://imoti.news/market-pulse/${fullPack.toDate}`;
  if (await prisma.scrapedUrl.findUnique({ where: { url: claimUrl } })) {
    return { status: "nothing_new", message: `Анализът към ${fullPack.toDate} вече е подготвен.` };
  }

  const { methodology, toDate, ...pack } = fullPack;
  void toDate;
  const draft = await writeDraft(pack);
  if ("error" in draft) return { status: "error", message: draft.error };

  const category = await prisma.category.findUnique({ where: { slug: "pazar-na-imoti" } });
  const article = await prisma.article.create({
    data: {
      slug: await generateUniqueSlug(draft.title),
      title: draft.title,
      excerpt: draft.excerpt,
      rewrittenContent: [...draft.paragraphs, methodology].join("\n"),
      originalUrl: claimUrl,
      sourceName: SOURCE_NAME,
      categoryId: category?.id ?? null,
      status: "draft",
      aiGenerated: true,
      isOriginal: true,
    },
  });

  await prisma.scrapedUrl.create({
    data: { url: claimUrl, status: "created", title: draft.title, articleId: article.id },
  });

  return {
    status: "created",
    message: `Чернова „${draft.title}“ (${pack.portalCount} портала, ${pack.weeks} седмици). Данни от: ${pack.series.map((s) => s.portal).join(", ")}.`,
    articleId: article.id,
  };
}
