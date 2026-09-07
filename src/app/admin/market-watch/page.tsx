import {
  getMarketWatch,
  updateMarketWatch,
  setMarketWatchImageFromUpload,
  removeMarketWatchImage,
  type MarketWatchStat,
} from "@/lib/actions/market-watch";
import { getPriceStatsSummary, getLatestMarketPriceStats, sourceLabel } from "@/lib/actions/price-stats";
import BlobUploadInput from "@/components/admin/BlobUploadInput";
import PriceStatsScrapeButton from "@/components/admin/PriceStatsScrapeButton";

const MAX_STATS = 5;

export default async function AdminMarketWatchPage() {
  const [marketWatch, priceStatsSummary, priceStatsRows] = await Promise.all([
    getMarketWatch(),
    getPriceStatsSummary(),
    getLatestMarketPriceStats(),
  ]);
  const stats = (marketWatch.stats as unknown as MarketWatchStat[] | null) ?? [];
  const rows = Array.from({ length: MAX_STATS }, (_, i) => stats[i] ?? { label: "", value: "", changePct: null });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Market Watch</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Седмичен пазарен анализ — постави готовия текст (от скрийншотите + ИИ инструмента, който
        ползваш) и по желание до {MAX_STATS} кратки показателя. Последно обновено:{" "}
        {marketWatch.updatedAt.toLocaleString("bg-BG")}.
      </p>

      <form action={updateMarketWatch} className="mt-6 max-w-2xl space-y-6">
        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-foreground">
            Анализ
          </label>
          <textarea
            id="summary"
            name="summary"
            defaultValue={marketWatch.summary}
            rows={8}
            placeholder="Постави тук готовия анализ на пазара за седмицата..."
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-foreground">Показатели (по желание)</span>
          <p className="mt-1 text-xs text-muted-foreground">
            Празен ред = не се показва на сайта. Пример: Жилищни цени (€/m²) / 1,643 / 8.2
          </p>
          <div className="mt-3 space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                <input
                  name={`statLabel${i}`}
                  defaultValue={row.label}
                  placeholder="Име (напр. Жилищни цени €/m²)"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <input
                  name={`statValue${i}`}
                  defaultValue={row.value}
                  placeholder="Стойност (напр. 1,643)"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <input
                  name={`statChange${i}`}
                  defaultValue={row.changePct ?? ""}
                  placeholder="% промяна (напр. 8.2 или -3.1)"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Запази
        </button>
      </form>

      <div className="mt-6 max-w-2xl">
        <label className="block text-sm font-medium text-foreground">
          Илюстративна снимка (по желание, само за показ)
        </label>
        {marketWatch.imageUrl && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={marketWatch.imageUrl}
              alt="Market Watch"
              className="h-20 w-32 rounded-md border border-border object-cover"
            />
            <form action={removeMarketWatchImage}>
              <button type="submit" className="text-xs text-red-600 hover:underline">
                Премахни снимката
              </button>
            </form>
          </div>
        )}
        <div className="mt-2">
          <BlobUploadInput
            onUploaded={async (urls) => {
              "use server";
              await setMarketWatchImageFromUpload(urls[0]);
            }}
          />
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Пазарни данни (сурови)</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Средни цени по квартали за Пловдив, събирани седмично от Imot.bg, Imoti.net и Alo.bg. Само
          събиране на данни засега — представянето на живия сайт (Market Watch тайла, графики) е
          следваща стъпка.
        </p>

        <div className="mt-4">
          <PriceStatsScrapeButton />
        </div>

        {priceStatsSummary.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {priceStatsSummary.map((s) => (
              <div key={s.source} className="rounded-md border border-border px-3 py-2">
                <div className="font-medium text-foreground">{sourceLabel(s.source)}</div>
                <div>{s.count} реда общо</div>
                <div>
                  последно: {s.lastAsOfDate ? new Date(s.lastAsOfDate).toLocaleDateString("bg-BG") : "—"}
                </div>
              </div>
            ))}
          </div>
        )}

        {priceStatsRows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Все още няма събрани данни.</p>
        ) : (
          <div className="mt-4 max-h-[600px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-border bg-background text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Източник</th>
                  <th className="px-3 py-2 font-medium">Квартал</th>
                  <th className="px-3 py-2 font-medium">Тип имот</th>
                  <th className="px-3 py-2 font-medium">Цена</th>
                  <th className="px-3 py-2 font-medium">€/кв.м</th>
                  <th className="px-3 py-2 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {priceStatsRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5 text-muted-foreground">{sourceLabel(row.source)}</td>
                    <td className="px-3 py-1.5 text-foreground">{row.district}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{row.propertyType}</td>
                    <td className="px-3 py-1.5 text-foreground">
                      {row.price !== null ? Math.round(row.price).toLocaleString("bg-BG") : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-foreground">
                      {row.pricePerSqm !== null ? Math.round(row.pricePerSqm).toLocaleString("bg-BG") : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {new Date(row.asOfDate).toLocaleDateString("bg-BG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
