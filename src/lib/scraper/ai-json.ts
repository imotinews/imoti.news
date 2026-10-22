import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

type JsonSchema = Record<string, unknown>;

// Provider-agnostic structured output, honouring the same AI_PROVIDER switch
// as the news rewriter. Clients are created on first use so a missing key for
// the provider that is not in use never breaks anything.
export async function generateJson<T>(options: {
  system: string;
  user: string;
  schema: JsonSchema;
  maxTokens?: number;
}): Promise<T | null> {
  if (process.env.AI_PROVIDER === "gemini") {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: options.user,
      config: {
        systemInstruction: options.system,
        responseMimeType: "application/json",
        responseSchema: options.schema as never,
      },
    });
    if (!response.text) return null;
    try {
      return JSON.parse(response.text) as T;
    } catch {
      return null;
    }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30000 });
  const tool: Anthropic.Tool = {
    name: "submit_result",
    description: "Submit the structured result.",
    input_schema: options.schema as unknown as Anthropic.Tool.InputSchema,
  };
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: options.maxTokens ?? 4000,
    system: options.system,
    tools: [tool],
    tool_choice: { type: "tool", name: "submit_result" },
    messages: [{ role: "user", content: options.user }],
  });
  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  return (toolUse?.input as T | undefined) ?? null;
}
