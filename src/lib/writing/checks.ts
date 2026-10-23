const NUMBER_PATTERN = /\d+(?:[  ]\d{3})*(?:[.,]\d+)?/g;

function normalizeNumber(token: string): string {
  return token.replace(/[  ]/g, "").replace(",", ".").replace(/^0+(?=\d)/, "");
}

export function extractNumbers(text: string): string[] {
  return (text.match(NUMBER_PATTERN) ?? []).map(normalizeNumber);
}

// Numbers in the written text that do not appear anywhere in the facts.
export function unknownNumbers(text: string, factsText: string): string[] {
  const allowed = new Set(extractNumbers(factsText));
  return [...new Set(extractNumbers(text).filter((n) => !allowed.has(n)))];
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[а-яa-z0-9]+/g) ?? [];
}

// Share of the new text's 5-word sequences that also occur in the original --
// the closer to 0, the less of the original's wording was carried over.
export function overlapRatio(original: string, candidate: string): number {
  const gramsOf = (list: string[]) => {
    const grams: string[] = [];
    for (let i = 0; i + 5 <= list.length; i++) grams.push(list.slice(i, i + 5).join(" "));
    return grams;
  };
  const originalGrams = new Set(gramsOf(words(original)));
  const candidateGrams = gramsOf(words(candidate));
  if (candidateGrams.length === 0) return 0;
  const shared = candidateGrams.filter((g) => originalGrams.has(g)).length;
  return shared / candidateGrams.length;
}

// Place and person names that are in the facts but nowhere in the written
// text -- catches a writer that quietly turns "in Germany" into "in the
// country", which would make a foreign story read as a Bulgarian one.
export function missingProperNouns(
  factsList: string[],
  candidate: string
): { missing: string[]; total: number } {
  const nouns = new Map<string, string>();
  for (const fact of factsList) {
    const tokens = fact.match(/[А-ЯA-Z][а-яa-z]{3,}/g) ?? [];
    const firstWord = fact.trim().split(/\s+/)[0]?.replace(/[^А-Яа-яA-Za-z]/g, "") ?? "";
    for (const token of tokens) {
      if (token === firstWord) continue;
      nouns.set(token.toLowerCase().slice(0, 5), token);
    }
  }
  const haystack = candidate.toLowerCase();
  const missing = [...nouns.entries()].filter(([prefix]) => !haystack.includes(prefix)).map(([, noun]) => noun);
  return { missing, total: nouns.size };
}

// A few of the 5-word sequences the candidate shares with the original, to
// tell the writer exactly which phrases to change.
export function sharedPhrases(original: string, candidate: string, limit = 3): string[] {
  const originalWords = words(original);
  const originalGrams = new Set<string>();
  for (let i = 0; i + 5 <= originalWords.length; i++) originalGrams.add(originalWords.slice(i, i + 5).join(" "));

  const candidateWords = words(candidate);
  const found: string[] = [];
  for (let i = 0; i + 5 <= candidateWords.length && found.length < limit; i++) {
    const gram = candidateWords.slice(i, i + 5).join(" ");
    if (originalGrams.has(gram) && !found.some((f) => f.includes(gram))) found.push(gram);
  }
  return found;
}

// "Investor.bg — Имоти" is referred to as "Investor.bg" in running text.
export function shortSourceName(sourceName: string): string {
  return sourceName.split(/\s+[—–-]\s+/)[0].trim();
}

export function countMentions(text: string, name: string): number {
  const lower = text.toLowerCase();
  const needle = name.toLowerCase();
  let count = 0;
  let index = lower.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = lower.indexOf(needle, index + needle.length);
  }
  return count;
}
