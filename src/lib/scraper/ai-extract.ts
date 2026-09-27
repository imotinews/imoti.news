import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30000 });

// Readability's heuristics miss real, legitimate pages -- old table-based
// layouts with no semantic <article> markup (e.g. novinite.com), or posts
// that are genuinely short (photo-heavy blog entries). This is a fallback
// only, tried after the free heuristic extractor already failed, so it
// costs one extra AI call solely on pages that would otherwise be a total
// loss for the scraper.
const MAX_HTML_CHARS = 15000;

export async function extractWithAI(html: string): Promise<{ title: string; text: string } | null> {
  const tool: Anthropic.Tool = {
    name: "submit_extraction",
    description: "Submit the extracted article title and body text.",
    input_schema: {
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
    },
  };

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system:
      "Извличаш основния текст на новинарска или блог статия от суров HTML. Игнорирай меню, реклами, странична лента, коментари, футър. Ако страницата не съдържа реална статия (напр. страница за вход, грешка, празен списък), върни found=false.",
    tools: [tool],
    tool_choice: { type: "tool", name: "submit_extraction" },
    messages: [{ role: "user", content: `HTML:\n${html.slice(0, MAX_HTML_CHARS)}` }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  const result = toolUse?.input as { found?: boolean; title?: string; text?: string } | undefined;

  if (!result?.found || !result.text) return null;
  return { title: result.title ?? "", text: result.text };
}
