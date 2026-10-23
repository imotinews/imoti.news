import { generateJson } from "@/lib/scraper/ai-json";
import { getScrapableCategorySlugs } from "@/lib/scraper/prompt";
import type { ClassifyResult } from "@/lib/scraper/types";
import { HOUSE_STYLE } from "./house-style";
import {
  countMentions,
  missingProperNouns,
  overlapRatio,
  shortSourceName,
  sharedPhrases,
  unknownNumbers,
} from "./checks";

// The same three steps for every source, so the source never changes how we
// write: (1) read the original and keep only its facts, (2) write a new text
// from those facts alone -- the writer never sees the original's sentences --
// (3) check the result before it can become a draft.
const PACE_MS = process.env.AI_PROVIDER === "gemini" ? 4500 : 0;
const MAX_ATTEMPTS = 3;
const MAX_OVERLAP = 0.1;

export type UniversalResult = ClassifyResult & { overlap?: number };

type FactSheet = {
  relevant?: boolean;
  category_slug?: string;
  facts?: string[];
  quote_text?: string;
  quote_by?: string;
};

type Draft = { title?: string; excerpt?: string; paragraphs?: string[] };

const RELEVANCE = {
  real_estate:
    "Релевантен е текст, свързан с пазара на недвижими имоти в България: пазар на имоти, ипотеки и финансиране, строителство, регулации и закони за имоти, инвестиции в имоти, международни имотни пазари.",
  lifestyle:
    "Релевантен е текст, полезен на собственик на жилище или човек, който обзавежда или ремонтира дом: интериорен дизайн, обзавеждане, ремонт, организация на пространство, градина, съвети за дома.",
};

const MANUAL_NOTE =
  'РЪЧЕН ВНОС: администраторът е избрал тази страница ръчно. Върни relevant=true, освен ако няма никакво смислено съдържание (меню, грешка, празна страница). Съобщения за събития, изложения, конференции, откривания и рекламни анонси са валидни: използвай категория "sabitiya", освен ако текстът явно пасва по-добре другаде, и пренеси само фактите, без рекламен език.';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractFactSheet(
  input: { title: string; text: string; sourceName: string; contentType?: "real_estate" | "lifestyle" },
  categorySlugs: string[],
  options: { skipRelevance: boolean; manual: boolean }
): Promise<FactSheet | null> {
  const system = [
    "Получаваш текст на статия от друг сайт. Ти НЕ пишеш статия. Само извличаш факти.",
    options.skipRelevance
      ? "СТЪПКА 1 — Релевантността вече е решена: върни relevant=true и избери най-подходящата категория."
      : `СТЪПКА 1 — РЕЛЕВАНТНОСТ: ${RELEVANCE[input.contentType === "lifestyle" ? "lifestyle" : "real_estate"]} Ако не е релевантен, върни relevant=false и празни facts.`,
    options.manual ? MANUAL_NOTE : "",
    "СТЪПКА 2 — ФАКТИ (само ако relevant=true): всеки факт е едно кратко самостоятелно твърдение с ТВОИ думи (до 30 думи): кой, какво, кога, къде, колко. Не копирай изречения от текста. Числа, имена, длъжности и дати — точно както са в текста. Включи САМО това, което е в текста, нищо от себе си. Всеки факт трябва да е разбираем сам по себе си: назовавай държавата, града, институцията или компанията, за които се отнася (например „в Германия“, „в Пловдив“) и никога не пиши само „в страната“, „у нас“ или „в държавата“, освен ако текстът изрично говори за България. Най-много 15 факта, най-важните първи.",
    "ЦИТАТ: ако има точен цитат на назован човек, който си струва, върни го дословно (до 25 думи) в quote_text и кой го казва в quote_by; иначе върни празни низове.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return generateJson<FactSheet>({
    system,
    user: `Източник: ${input.sourceName}\n\nЗаглавие: ${input.title}\n\nТекст:\n${input.text.slice(0, 12000)}`,
    schema: {
      type: "object",
      properties: {
        relevant: { type: "boolean" },
        category_slug: { type: "string", enum: categorySlugs },
        facts: { type: "array", items: { type: "string" } },
        quote_text: { type: "string" },
        quote_by: { type: "string" },
      },
      required: ["relevant", "category_slug", "facts", "quote_text", "quote_by"],
    },
  });
}

async function writeFromFacts(
  sheet: { facts: string[]; quote: { text: string; by: string } | null },
  sourceName: string,
  originalText: string,
  contentType: "real_estate" | "lifestyle" | undefined
): Promise<{ draft: Required<Draft>; overlap: number }> {
  const shortName = shortSourceName(sourceName);
  // The source's own name may contain digits (Plovdiv24.bg), so it is allowed too.
  const factsText = [...sheet.facts, sheet.quote?.text ?? "", shortName].join("\n");
  const system = `Ти си редактор в imoti.news, българско издание за пазара на недвижими имоти${
    contentType === "lifestyle" ? ' (раздел „Съвети и дизайн“, по-непринуден и практичен тон)' : ""
  }. Пишеш нова новина на български САМО от подадените факти.

${HOUSE_STYLE}

Името на източника се пише ТОЧНО така: „${shortName}“. Трябва да е в първия абзац и поне още веднъж по-нататък.

Заглавието казва конкретно основната новина (кой, какво, къде) като изречение с глагол, не обща тема като „Анализ на...“ или „Влиянието на...“. Никога не пиши „в страната“, „у нас“, „в държавата“ или „на пазара“ без име: винаги назовавай държавата, града или компанията така, както са във фактите. Цитатът се въвежда естествено („според X: „...“), без думите „посочва в цитат“.

Върни: title (ново заглавие до 90 знака), excerpt (1-2 изречения) и paragraphs (от 3 до 5 абзаца).`;

  let feedback = "";
  let lastProblem = "няма резултат";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (PACE_MS && attempt >= 0) await sleep(PACE_MS);

    const draft = await generateJson<Draft>({
      system,
      user: `${JSON.stringify({ sourceName: shortName, facts: sheet.facts, quote: sheet.quote }, null, 2)}${feedback}`,
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
      lastProblem = "непълен отговор";
      feedback = "\n\nПредишният отговор беше непълен. Върни title, excerpt и paragraphs.";
      continue;
    }

    const text = [draft.title, draft.excerpt, ...draft.paragraphs].join("\n");
    const problems: string[] = [];

    const unknown = unknownNumbers(text, factsText);
    if (unknown.length > 0) problems.push(`използвани са числа, които не са във фактите (${unknown.join(", ")})`);

    const inFirst = countMentions(draft.paragraphs[0], shortName) >= 1;
    const total = countMentions(draft.paragraphs.join("\n"), shortName);
    if (!inFirst || total < 2) {
      problems.push(`източникът „${shortName}“ трябва да е назован в първия абзац и поне още веднъж в текста`);
    }

    const { missing, total: nounTotal } = missingProperNouns(sheet.facts, text);
    if (nounTotal > 0 && missing.length / nounTotal >= 0.3) {
      problems.push(`липсват имена от фактите (${missing.slice(0, 5).join(", ")}), назови държавата, града и компаниите`);
    }

    // The one allowed quote matches the original by design, so it is left out.
    let body = draft.paragraphs.join("\n");
    if (sheet.quote?.text) body = body.split(sheet.quote.text).join(" ");
    const overlap = overlapRatio(originalText, body);
    if (overlap > MAX_OVERLAP) {
      const phrases = sharedPhrases(originalText, body);
      problems.push(
        `текстът е твърде близък до оригинала${phrases.length ? ` (повтарящи се фрази: „${phrases.join("“, „")}“)` : ""}, пренареди го и използвай други думи`
      );
    }

    if (problems.length === 0) {
      return { draft: draft as Required<Draft>, overlap };
    }

    lastProblem = problems.join("; ");
    feedback = `\n\nПредишният отговор беше отхвърлен: ${lastProblem}. Поправи го.`;
  }

  throw new Error(`Текстът не мина проверките: ${lastProblem}`);
}

// Drop-in replacement for the old one-shot rewrite, same result shape.
export async function universalRewrite(input: {
  title: string;
  text: string;
  sourceName: string;
  contentType?: "real_estate" | "lifestyle";
  manual?: boolean;
  skipRelevance?: boolean;
}): Promise<UniversalResult> {
  const categorySlugs = await getScrapableCategorySlugs();
  const manual = input.manual ?? false;
  const skipRelevance = (input.skipRelevance ?? false) || manual;

  const sheet = await extractFactSheet(input, categorySlugs, { skipRelevance, manual });
  const facts = (sheet?.facts ?? []).map((f) => f.trim()).filter(Boolean);

  if (!sheet || (!skipRelevance && !sheet.relevant)) return { relevant: false };
  if (facts.length < 2) {
    if (skipRelevance) throw new Error("Няма достатъчно факти за текст.");
    return { relevant: false };
  }

  const quote =
    sheet.quote_text && sheet.quote_text.trim() && sheet.quote_by && sheet.quote_by.trim()
      ? { text: sheet.quote_text.trim(), by: sheet.quote_by.trim() }
      : null;

  const { draft, overlap } = await writeFromFacts({ facts, quote }, input.sourceName, input.text, input.contentType);

  return {
    relevant: true,
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    content: draft.paragraphs.map((p) => p.trim()).filter(Boolean).join("\n"),
    categorySlug: categorySlugs.includes(sheet.category_slug ?? "") ? (sheet.category_slug as string) : null,
    overlap,
  };
}
