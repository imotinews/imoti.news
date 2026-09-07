// Bulgarian property portals format numbers as "218 464" (space as thousands
// separator, sometimes a non-breaking space) or "-" for no data.
export function parseBgNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s ]/g, "").replace(",", ".").trim();
  if (!cleaned || cleaned === "-") return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}
