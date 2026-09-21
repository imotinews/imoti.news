"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

// Filters live in the URL (?status=&category=&source=) so a filtered list can
// be bookmarked and the status tabs can carry them along.
export default function ArticleFilters({
  status,
  category,
  source,
  categoryOptions,
  sourceOptions,
}: {
  status?: string;
  category?: string;
  source?: string;
  categoryOptions: Option[];
  sourceOptions: Option[];
}) {
  const router = useRouter();

  function go(next: { category?: string; source?: string }) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const nextCategory = "category" in next ? next.category : category;
    const nextSource = "source" in next ? next.source : source;
    if (nextCategory) params.set("category", nextCategory);
    if (nextSource) params.set("source", nextSource);
    const qs = params.toString();
    router.push(qs ? `/admin/articles?${qs}` : "/admin/articles");
  }

  const selectClass =
    "rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <select
        aria-label="Категория"
        value={category ?? ""}
        onChange={(e) => go({ category: e.target.value })}
        className={selectClass}
      >
        <option value="">Всички категории</option>
        {categoryOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Източник"
        value={source ?? ""}
        onChange={(e) => go({ source: e.target.value })}
        className={selectClass}
      >
        <option value="">Всички източници</option>
        {sourceOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {(category || source) && (
        <button
          type="button"
          onClick={() => go({ category: "", source: "" })}
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          Изчисти филтрите
        </button>
      )}
    </div>
  );
}
