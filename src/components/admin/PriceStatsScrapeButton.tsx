"use client";

import { useActionState } from "react";
import { runPriceStatsScrapeNow, sourceLabel } from "@/lib/actions/price-stats";
import type { PriceStatsSourceResult } from "@/lib/price-stats/run";

type State = { status: "idle" | "done"; results: PriceStatsSourceResult[] };

async function action(_prev: State): Promise<State> {
  const results = await runPriceStatsScrapeNow();
  return { status: "done", results };
}

export default function PriceStatsScrapeButton() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {
    status: "idle",
    results: [],
  });

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Събиране..." : "Събери данни сега"}
      </button>

      {state.status === "done" && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {state.results.map((r) => (
            <li key={r.source}>
              {sourceLabel(r.source)}: {r.error ? <span className="text-red-700">грешка — {r.error}</span> : `${r.rowsSaved} реда`}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
