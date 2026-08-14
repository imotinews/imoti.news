function normalizeTitle(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection += 1;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.7;

// Cheap pre-filter run before spending a fetch + AI call on an item: if a
// recent article's title overlaps this much, they're almost certainly the
// same underlying story reported by two different sources.
export function findSimilarTitle(candidateTitle: string, recentTitles: string[]): string | null {
  const candidateWords = normalizeTitle(candidateTitle);

  for (const existingTitle of recentTitles) {
    const similarity = jaccardSimilarity(candidateWords, normalizeTitle(existingTitle));
    if (similarity > SIMILARITY_THRESHOLD) {
      return existingTitle;
    }
  }

  return null;
}
