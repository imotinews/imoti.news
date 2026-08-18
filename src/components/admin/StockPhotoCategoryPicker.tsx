"use client";

import { updateStockPhotoCategory } from "@/lib/actions/stock-photos";

export default function StockPhotoCategoryPicker({
  photoId,
  currentCategoryId,
  categories,
}: {
  photoId: string;
  currentCategoryId: string | null;
  categories: { id: string; name: string }[];
}) {
  return (
    <form action={updateStockPhotoCategory.bind(null, photoId)}>
      <select
        name="categoryId"
        defaultValue={currentCategoryId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
      >
        <option value="">— без категория —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </form>
  );
}
