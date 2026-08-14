import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export function deriveExcerpt(content: string): string {
  const firstParagraph = content.split("\n").find(Boolean) ?? "";
  return firstParagraph.length > 200 ? `${firstParagraph.slice(0, 197)}...` : firstParagraph;
}

const WORDS_PER_MINUTE = 200;

export function estimateReadMinutes(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "novina";
  let candidate = base;
  let suffix = 2;

  while (await prisma.article.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
