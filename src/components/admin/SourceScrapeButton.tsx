"use client";

import { useActionState } from "react";
import { runSourceScrapeNow } from "@/lib/actions/scraper";

type State = { status: "idle" | "started" };

async function action(_prev: State, formData: FormData): Promise<State> {
  const sourceId = formData.get("sourceId") as string;
  await runSourceScrapeNow(sourceId);
  return { status: "started" };
}

export default function SourceScrapeButton({ sourceId }: { sourceId: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, { status: "idle" });

  return (
    <form action={formAction}>
      <input type="hidden" name="sourceId" value={sourceId} />
      <button
        type="submit"
        disabled={pending || state.status === "started"}
        className="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Стартиране..." : state.status === "started" ? "Стартирано ✓" : "Провери сега"}
      </button>
    </form>
  );
}
