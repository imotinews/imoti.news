import { getMarketWatch, updateMarketWatch, type MarketWatchStat } from "@/lib/actions/market-watch";

const MAX_STATS = 5;

export default async function AdminMarketWatchPage() {
  const marketWatch = await getMarketWatch();
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

      <form action={updateMarketWatch} encType="multipart/form-data" className="mt-6 max-w-2xl space-y-6">
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

        <div>
          <label htmlFor="imageFile" className="block text-sm font-medium text-foreground">
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
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="removeImage" className="h-4 w-4" />
                Премахни снимката
              </label>
            </div>
          )}
          <input
            id="imageFile"
            name="imageFile"
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm text-foreground"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Запази
        </button>
      </form>
    </div>
  );
}
