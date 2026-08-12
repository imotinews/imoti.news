import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export function deriveExcerpt(content: string): string {
  const firstParagraph = content.split("\n").find(Boolean) ?? "";
  return firstParagraph.length > 200 ? `${firstParagraph.slice(0, 197)}...` : firstParagraph;
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
