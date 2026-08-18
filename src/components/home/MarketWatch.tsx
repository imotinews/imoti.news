import Container from "@/components/layout/Container";
import { getMarketWatch, type MarketWatchStat } from "@/lib/actions/market-watch";

function ChangeBadge({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${positive ? "text-primary" : "text-red-600"}`}>
      {positive ? "+" : ""}
      {pct.toFixed(1)}% {positive ? "▲" : "▼"}
    </span>
  );
}

export default async function MarketWatch() {
  const marketWatch = await getMarketWatch();
  const stats = (marketWatch.stats as unknown as MarketWatchStat[] | null) ?? [];

  // Hidden until there's real content -- weekly-updated by the admin from
  // her own analysis, no fabricated placeholder numbers shown to visitors.
  if (!marketWatch.summary && stats.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-border py-8">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m3 17 6-6 4 4 8-8M15 7h6v6" />
              </svg>
              Market Watch
            </div>

            {stats.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                {stats.map((tile) => (
                  <div key={tile.label} className="border-l border-border pl-3 first:border-l-0 first:pl-0">
                    <p className="text-xs text-muted-foreground">{tile.label}</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{tile.value}</p>
                    {tile.changePct !== null && <ChangeBadge pct={tile.changePct} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-6">
            {marketWatch.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={marketWatch.imageUrl}
                alt="Market Watch"
                className="hidden h-full w-32 shrink-0 rounded-md object-cover sm:block"
              />
            )}
            {marketWatch.summary && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {marketWatch.summary}
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
