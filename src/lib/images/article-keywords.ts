import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Ти помагаш да намерим подходяща снимка от Unsplash за българска новина за имоти. Прочети заглавието (и резюмето, ако има) и върни 2-4 английски ключови думи за търсене на снимка, фокусирани върху КОНКРЕТНИЯ обект/място/тема в новината -- например град (преведи на английски: Пловдив -> Plovdiv), тип сграда (училище -> school building, хотел -> hotel, мол -> shopping mall), конкретен обект. Не връщай общи думи като "real estate" или "Bulgaria", освен ако наистина няма нищо по-конкретно в текста. Върни САМО ключовите думи на английски, разделени с интервал -- нищо друго, никакво обяснение.`;

// Best-effort: any failure here just means the Unsplash fallback uses the
// category's generic keywords instead, never blocks the publish itself.
export async function deriveArticleImageKeywords(
  title: string,
  excerpt: string | null
): Promise<string | null> {
  const provider = process.env.AI_PROVIDER || "anthropic";
  const input = `Заглавие: ${title}${excerpt ? `\nРезюме: ${excerpt}` : ""}`;

  try {
    const text = provider === "gemini" ? await deriveWithGemini(input) : await deriveWithAnthropic(input);
    return text?.trim() || null;
  } catch {
    return null;
  }
}

async function deriveWithGemini(input: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: input,
    config: { systemInstruction: SYSTEM_PROMPT },
  });

  return response.text ?? null;
}

async function deriveWithAnthropic(input: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey, timeout: 15000 });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 60,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && "text" in block ? block.text : null;
}
