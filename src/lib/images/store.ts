import { put, del } from "@vercel/blob";
import { GoogleGenAI, Modality } from "@google/genai";

type ImageBytes = { bytes: Buffer; contentType: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — plenty for a news photo, keeps uploads/pages light

export async function uploadImage(image: ImageBytes, filenameHint: string): Promise<string> {
  const extension = image.contentType.split("/")[1] ?? "jpg";
  const safeName = filenameHint.replace(/[^a-z0-9-]/gi, "-").slice(0, 60);
  const blob = await put(`articles/${safeName}-${Date.now()}.${extension}`, image.bytes, {
    access: "public",
    contentType: image.contentType,
  });
  return blob.url;
}

export async function deleteImage(url: string): Promise<void> {
  await del(url).catch(() => {
    // Best-effort -- an orphaned blob costs nothing to leave behind, but a
    // thrown delete error shouldn't block the admin action that called this.
  });
}

function extractOgImage(html: string): string | null {
  const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return match?.[1] ?? null;
}

// Accepts either a direct image URL or a webpage URL (extracts <meta property="og:image">).
export async function fetchImageFromUrl(sourceUrl: string): Promise<ImageBytes | null> {
  const initial = await fetch(sourceUrl, {
    headers: { "User-Agent": "imoti.news (+https://imoti.news)" },
  }).catch(() => null);

  if (!initial || !initial.ok) return null;

  const contentType = initial.headers.get("content-type") ?? "";

  if (contentType.startsWith("image/")) {
    const buffer = Buffer.from(await initial.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) return null;
    return { bytes: buffer, contentType: contentType.split(";")[0] };
  }

  if (!contentType.includes("text/html")) return null;

  const html = await initial.text();
  const ogImageUrl = extractOgImage(html);
  if (!ogImageUrl) return null;

  const absoluteUrl = new URL(ogImageUrl, sourceUrl).toString();
  const imageResponse = await fetch(absoluteUrl, {
    headers: { "User-Agent": "imoti.news (+https://imoti.news)" },
  }).catch(() => null);

  if (!imageResponse || !imageResponse.ok) return null;
  const imageContentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
  if (!imageContentType.startsWith("image/")) return null;

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) return null;

  return { bytes: buffer, contentType: imageContentType.split(";")[0] };
}

// The free Gemini tier has a hard 0-request quota for image-generation
// models (confirmed by testing, not a transient rate limit) -- surface
// that plainly instead of a generic failure.
export class ImageGenQuotaError extends Error {}

export async function generateImageWithAI(input: {
  title: string;
  excerpt: string;
}): Promise<ImageBytes | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const client = new GoogleGenAI({ apiKey });

  const prompt = `Създай реалистична, редакционна новинарска снимка (photojournalism style, не илюстрация/рисунка) за статия за българския пазар на недвижими имоти със заглавие: "${input.title}". ${input.excerpt ? `Контекст: ${input.excerpt}` : ""} Без текст и надписи в снимката.`;

  let response;
  try {
    response = await client.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: prompt,
      config: { responseModalities: [Modality.IMAGE] },
    });
  } catch (error) {
    const message = (error as Error).message ?? "";
    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
      throw new ImageGenQuotaError(
        "AI генерирането на снимки изисква платен Gemini план (безплатният план няма достъп до image модела)."
      );
    }
    throw error;
  }

  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const inlineData = part?.inlineData;
  if (!inlineData?.data) return null;

  return {
    bytes: Buffer.from(inlineData.data, "base64"),
    contentType: inlineData.mimeType ?? "image/png",
  };
}
