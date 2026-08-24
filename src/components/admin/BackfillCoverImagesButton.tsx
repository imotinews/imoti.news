"use client";

import { useActionState } from "react";
import { runStockPhotoBackfill } from "@/lib/actions/stock-photos";

type State = { status: "idle" | "done"; assigned?: number; skipped?: number };

async function action(_prev: State): Promise<State> {
  const result = await runStockPhotoBackfill();
  return { status: "done", assigned: result.assigned, skipped: result.skipped };
}

export default function BackfillCoverImagesButton() {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Разпределя се..." : "Разпредели по новини без снимка"}
      </button>
      {state.status === "done" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Разпределени: {state.assigned}. Пропуснати: {state.skipped} (без категория или без качени снимки за
          тази категория).
        </p>
      )}
    </form>
  );
}
