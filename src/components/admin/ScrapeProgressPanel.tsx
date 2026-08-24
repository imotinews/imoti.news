"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLatestScrapeRun } from "@/lib/actions/scraper";

type ScrapeRun = {
  id: string;
  status: string;
  startedAt: Date | string;
  finishedAt: Date | string | null;
  totalSources: number;
  sourcesDone: number;
  currentSourceName: string | null;
  itemsSeen: number;
  created: number;
  errors: number;
};

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "току-що";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `преди ${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `преди ${hours} ч`;
  return new Date(date).toLocaleDateString("bg-BG");
}

export default function ScrapeProgressPanel({ initialRun }: { initialRun: ScrapeRun | null }) {
  const [run, setRun] = useState(initialRun);
  const router = useRouter();

  useEffect(() => {
    if (!run || run.status !== "running") return;

    const interval = setInterval(async () => {
      const latest = await getLatestScrapeRun();
      setRun(latest);
      if (latest && latest.status !== "running") {
        router.refresh();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [run?.id, run?.status, router]);

  if (!run) return null;

  if (run.status === "running") {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted p-4 text-sm text-foreground">
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>
          Скрейпва: <strong>{run.currentSourceName ?? "…"}</strong> ({run.sourcesDone}/{run.totalSources}{" "}
          източника) &middot; {run.created} нови статии досега
        </span>
      </div>
    );
  }

  const isFailed = run.status === "failed";

  return (
    <div
      className={
        isFailed
          ? "mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          : "mt-4 rounded-md border border-border bg-muted p-4 text-sm text-foreground"
      }
    >
      {isFailed
        ? `Скрейпването спря с грешка ${run.finishedAt ? timeAgo(run.finishedAt) : ""}.`
        : `Последно скрейпване: ${run.finishedAt ? timeAgo(run.finishedAt) : ""} — ${run.created} нови статии, ${run.errors} грешки от ${run.sourcesDone} източника.`}
    </div>
  );
}
