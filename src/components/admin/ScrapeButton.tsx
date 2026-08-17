"use client";

import { useFormStatus } from "react-dom";

export default function ScrapeButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Работи... (може да отнеме няколко минути)
        </span>
      ) : (
        "Изтегли новини сега"
      )}
    </button>
  );
}
