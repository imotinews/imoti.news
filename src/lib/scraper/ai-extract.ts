import { generateJson } from "./ai-json";

// Readability's heuristics miss real, legitimate pages -- old table-based
// layouts with no semantic <article> markup (e.g. novinite.com), or posts
// that are genuinely short (photo-heavy blog entries). This is a fallback
// only, tried after the free heuristic extractor already failed, so it
// costs one extra AI call solely on pages that would otherwise be a total
// loss for the scraper.
const MAX_HTML_CHARS = 15000;

const SCHEMA = {
  type: "object",
  properties: {
    found: {
      type: "boolean",
      description: "Дали на страницата има реална статия за извличане.",
    },
    title: { type: "string", description: "Заглавието на статията, ако found=true." },
    text: {
      type: "string",
      description:
        "Пълният текст на статията (само тялото, без навигация, реклами, странична лента, коментари), ако found=true.",
    },
  },
  required: ["found", "title", "text"],
} as const;

export async function extractWithAI(html: string): Promise<{ title: string; text: string } | null> {
  const result = await generateJson<{ found?: boolean; title?: string; text?: string }>({
    system:
      "Извличаш основния текст на новинарска или блог статия от суров HTML. Игнорирай меню, реклами, странична лента, коментари, футър. Ако страницата не съдържа реална статия (напр. страница за вход, грешка, празен списък), върни found=false.",
    user: `HTML:\n${html.slice(0, MAX_HTML_CHARS)}`,
    schema: SCHEMA,
  });

  if (!result?.found || !result.text) return null;
  return { title: result.title ?? "", text: result.text };
}
