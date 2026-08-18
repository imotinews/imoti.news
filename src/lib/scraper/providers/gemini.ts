import { GoogleGenAI } from "@google/genai";
import {
  SYSTEM_PROMPT,
  LIFESTYLE_SYSTEM_PROMPT,
  buildClassificationSchema,
  buildUserPrompt,
  toClassifyResult,
  type RawClassification,
} from "../prompt";
import type { ClassifyResult } from "../types";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function classifyAndRewriteWithGemini(
  input: {
    title: string;
    text: string;
    sourceName: string;
    contentType?: "real_estate" | "lifestyle";
  },
  categorySlugs: string[]
): Promise<ClassifyResult> {
  const response = await client.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: buildUserPrompt(input),
    config: {
      systemInstruction: input.contentType === "lifestyle" ? LIFESTYLE_SYSTEM_PROMPT : SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: buildClassificationSchema(categorySlugs),
    },
  });

  const text = response.text;
  if (!text) {
    console.error("[gemini] empty response.text, full response:", JSON.stringify(response));
    return { relevant: false };
  }

  let raw: RawClassification | undefined;
  try {
    raw = JSON.parse(text) as RawClassification;
  } catch (parseError) {
    console.error("[gemini] JSON.parse failed:", parseError, "text was:", text);
    return { relevant: false };
  }

  return toClassifyResult(raw, categorySlugs);
}
