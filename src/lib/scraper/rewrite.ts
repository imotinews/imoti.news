import { classifyAndRewriteWithAnthropic } from "./providers/anthropic";
import { classifyAndRewriteWithGemini } from "./providers/gemini";
import { getScrapableCategorySlugs } from "./prompt";
import type { ClassifyResult } from "./types";

export async function classifyAndRewrite(input: {
  title: string;
  text: string;
  sourceName: string;
  contentType?: "real_estate" | "lifestyle";
}): Promise<ClassifyResult> {
  const provider = process.env.AI_PROVIDER || "anthropic";
  const categorySlugs = await getScrapableCategorySlugs();

  if (provider === "gemini") {
    return classifyAndRewriteWithGemini(input, categorySlugs);
  }

  return classifyAndRewriteWithAnthropic(input, categorySlugs);
}
