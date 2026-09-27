"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { runSourceScrapeNow } from "@/lib/actions/scraper";

type State = { status: "idle" | "started" };

export default function SourceScrapeButton({ sourceId }: { sourceId: string }) {
  const router = useRouter();

  async function action(_prev: State, formData: FormData): Promise<State> {
    const id = formData.get("sourceId") as string;
    await runSourceScrapeNow(id);
    // The progress panel above the table only starts polling once it sees
    // a "running" ScrapeRun -- without this refresh it keeps showing the
    // previous run's summary until the admin reloads the page by hand.
    router.refresh();
    return { status: "started" };
  }

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
