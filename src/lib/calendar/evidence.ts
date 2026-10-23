import { prisma } from "@/lib/prisma";

const PORTALS: Record<string, { name: string; page: string }> = {
  alo_bg: { name: "Alo.bg", page: "alo.bg/sredni_ceni" },
  imoti_net: { name: "Imoti.net", page: "imoti.net/bg/sredni-ceni" },
  imot_bg: { name: "Imot.bg", page: "imot.bg/sredni-ceni" },
};

const MAX_WEEKS = 8;
const MIN_WEEKS = 3;
const MIN_DISTRICTS = 10;
// A quarter whose average jumps more than this from one week to the next is
// almost certainly a data glitch (one fake -45% swing already showed up), so
// it is left out of the series and counted in the methodology.
const OUTLIER_WEEKLY_CHANGE = 0.25;
// Over a window of a few weeks, moves under 2% are within normal noise for a
// simple district average, so they are described as "stable".
const STABLE_BELOW_PCT = 2.0;
const WEEK_WORDS: Record<number, string> = { 3: "три", 4: "четири", 5: "пет", 6: "шест", 7: "седем", 8: "осем" };

const MONTHS = [
  "януари", "февруари", "март", "април", "май", "юни",
  "юли", "август", "септември", "октомври", "ноември", "декември",
];

export type Series = {
  portal: string;
  page: string;
  districts: number;
  excludedDistricts: number;
  first: number;
  firstText: string;
  last: number;
  lastText: string;
  min: number;
  minText: string;
  max: number;
  maxText: string;
  changePct: number;
  changeText: string;
  changeWords: string;
  trend: "stable" | "up" | "down";
};

export type EvidencePack = {
  city: string;
  propertyType: string;
  unit: string;
  periodText: string;
  toDate: string;
  weeks: number;
  weeksText: string;
  weeksWord: string;
  portalCount: number;
  leadPhrase: string;
  verdict: "stable" | "up" | "down" | "diverge";
  verdictPhrase: string;
  titleHint: string;
  series: Series[];
  gapText: string | null;
  methodology: string;
};

const intText = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const pctText = (n: number) => `${n < 0 ? "-" : ""}${Math.abs(n).toFixed(1).replace(".", ",")}%`;
const dayText = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

type Row = { source: string; district: string; date: string; ppsqm: number };

function isCleanName(name: string): boolean {
  return name.trim().length > 0 && !name.includes("�");
}

function groupBySource(rows: Row[]): Map<string, Row[]> {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const list = grouped.get(row.source) ?? [];
    list.push(row);
    grouped.set(row.source, list);
  }
  return grouped;
}

function buildSeries(source: string, rows: Row[], dates: string[]): Series | null {
  const bySource = rows.filter((r) => dates.includes(r.date));
  const districts = new Map<string, Map<string, number>>();
  for (const row of bySource) {
    const perDate = districts.get(row.district) ?? new Map<string, number>();
    perDate.set(row.date, row.ppsqm);
    districts.set(row.district, perDate);
  }

  let panel = [...districts.entries()].filter(([, perDate]) => dates.every((d) => perDate.has(d)));
  const panelSize = panel.length;

  panel = panel.filter(([, perDate]) => {
    for (let i = 1; i < dates.length; i++) {
      const prev = perDate.get(dates[i - 1])!;
      const cur = perDate.get(dates[i])!;
      if (prev > 0 && Math.abs(cur - prev) / prev > OUTLIER_WEEKLY_CHANGE) return false;
    }
    return true;
  });

  if (panel.length < MIN_DISTRICTS) return null;

  const averages = dates.map((d) => panel.reduce((sum, [, perDate]) => sum + perDate.get(d)!, 0) / panel.length);
  const first = averages[0];
  const last = averages[averages.length - 1];
  const changePct = ((last - first) / first) * 100;
  const portal = PORTALS[source];

  return {
    portal: portal.name,
    page: portal.page,
    districts: panel.length,
    excludedDistricts: panelSize - panel.length,
    first: Math.round(first),
    firstText: intText(first),
    last: Math.round(last),
    lastText: intText(last),
    min: Math.round(Math.min(...averages)),
    minText: intText(Math.min(...averages)),
    max: Math.round(Math.max(...averages)),
    maxText: intText(Math.max(...averages)),
    changePct: Math.round(changePct * 10) / 10,
    changeText: pctText(changePct),
    changeWords:
      Math.abs(changePct) < 0.05
        ? "без промяна"
        : `${changePct < 0 ? "спад" : "ръст"} от ${Math.abs(changePct).toFixed(1).replace(".", ",")}%`,
    trend: Math.abs(changePct) < STABLE_BELOW_PCT ? "stable" : changePct > 0 ? "up" : "down",
  };
}

// Everything the article may say lives in this object. The writer gets nothing
// else, and a validator rejects any number in the text that is not in here.
export async function buildEvidencePack(): Promise<EvidencePack | null> {
  const raw = await prisma.marketPriceStat.findMany({
    where: {
      propertyType: { startsWith: "Двустаен" },
      pricePerSqm: { not: null },
      source: { in: Object.keys(PORTALS) },
    },
    select: { source: true, district: true, asOfDate: true, pricePerSqm: true },
    orderBy: { asOfDate: "asc" },
  });

  const rows: Row[] = raw
    .filter((r) => isCleanName(r.district) && r.pricePerSqm !== null)
    .map((r) => ({
      source: r.source,
      district: r.district.trim(),
      date: r.asOfDate.toISOString().slice(0, 10),
      ppsqm: r.pricePerSqm as number,
    }));

  const grouped = groupBySource(rows);
  let sources = [...grouped.keys()].filter((s) => new Set(grouped.get(s)!.map((r) => r.date)).size >= MIN_WEEKS);

  // Use only the dates every qualifying portal has, so the period is the same
  // for all of them; drop the shortest history until at least 3 weeks remain.
  let dates: string[] = [];
  while (sources.length >= 2) {
    const dateSets = sources.map((s) => new Set(grouped.get(s)!.map((r) => r.date)));
    dates = [...dateSets[0]].filter((d) => dateSets.every((set) => set.has(d))).sort().slice(-MAX_WEEKS);
    if (dates.length >= MIN_WEEKS) break;
    const shortest = sources.reduce((a, b) => (grouped.get(a)!.length <= grouped.get(b)!.length ? a : b));
    sources = sources.filter((s) => s !== shortest);
  }
  if (sources.length < 2 || dates.length < MIN_WEEKS) return null;

  const series = sources
    .map((s) => buildSeries(s, grouped.get(s)!, dates))
    .filter((s): s is Series => s !== null);
  if (series.length < 2) return null;

  const from = dates[0];
  const to = dates[dates.length - 1];
  const year = to.slice(0, 4);
  const periodText = `от ${dayText(from)} до ${dayText(to)} ${year} г.`;
  const portalCount = series.length;
  const leadPhrase = portalCount >= 3 ? "във водещите портали за имоти" : "в два от водещите портали за имоти";

  const trends = new Set(series.map((s) => s.trend));
  const verdict: EvidencePack["verdict"] = trends.size > 1 ? "diverge" : [...trends][0];
  const verdictPhrase = {
    stable: "остават почти непроменени",
    up: "растат",
    down: "намаляват",
    diverge: "се движат в различни посоки",
  }[verdict];
  const verdictShort = {
    stable: "остават стабилни",
    up: "растат",
    down: "намаляват",
    diverge: "се движат в различни посоки",
  }[verdict];
  const weeksWord = WEEK_WORDS[dates.length] ?? String(dates.length);
  const titleHint = `Пловдив: офертните цени на двустайните ${verdictShort} ${weeksWord} седмици`;

  const lasts = series.map((s) => s.last);
  const gap = ((Math.max(...lasts) - Math.min(...lasts)) / Math.min(...lasts)) * 100;

  const counts = series.map((s) => s.districts).join(" и ");
  const excluded = series.reduce((sum, s) => sum + s.excludedDistricts, 0);
  const methodology =
    `Как го изчислихме: Средни офертни цени на двустайни апартаменти по квартали в Пловдив (евро на кв. м), от публичните страници „Средни цени“ на водещи портали за имоти, събирани веднъж седмично ${periodText} ` +
    `Сравнени са едни и същи квартали във всички седмици (съответно ${counts} квартала по портали). Простата средна стойност не е претеглена по брой обяви. ` +
    `${excluded > 0 ? `Квартали със седмична промяна над 25% са изключени като аномалии (${excluded}). ` : ""}` +
    `Данните са само за Пловдив и само за двустайни апартаменти.`;

  return {
    city: "Пловдив",
    propertyType: "двустайни апартаменти",
    unit: "евро на кв. м",
    periodText,
    toDate: to,
    weeks: dates.length,
    weeksText: String(dates.length),
    weeksWord,
    portalCount,
    leadPhrase,
    verdict,
    verdictPhrase,
    titleHint,
    series,
    gapText: pctText(gap).replace("-", ""),
    methodology,
  };
}
