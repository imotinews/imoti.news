import Anthropic from "@anthropic-ai/sdk";
import {
  buildSystemPrompt,
  buildClassificationSchema,
  buildUserPrompt,
  toClassifyResult,
  type RawClassification,
} from "../prompt";
import type { ClassifyResult } from "../types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30000 });

export async function classifyAndRewriteWithAnthropic(
  input: {
    title: string;
    text: string;
    sourceName: string;
    contentType?: "real_estate" | "lifestyle";
    manual?: boolean;
  },
  categorySlugs: string[]
): Promise<ClassifyResult> {
  const tool: Anthropic.Tool = {
    name: "submit_classification",
    description: "Submit the relevance classification and, if relevant, the rewritten article.",
    input_schema: buildClassificationSchema(categorySlugs) as unknown as Anthropic.Tool.InputSchema,
  };

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: buildSystemPrompt(input),
    tools: [tool],
    tool_choice: { type: "tool", name: "submit_classification" },
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  return toClassifyResult(toolUse?.input as RawClassification | undefined, categorySlugs);
}
