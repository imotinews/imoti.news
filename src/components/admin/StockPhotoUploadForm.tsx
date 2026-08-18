"use client";

import { useState } from "react";
import BlobUploadInput from "@/components/admin/BlobUploadInput";
import { createStockPhotosFromUrls } from "@/lib/actions/stock-photos";

export default function StockPhotoUploadForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [categoryId, setCategoryId] = useState("");

  return (
    <div>
      <label htmlFor="stockCategory" className="block text-sm font-medium text-foreground">
        Категория за тези снимки
      </label>
      <select
        id="stockCategory"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="mt-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="">— без категория —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="mt-3">
        <label className="block text-sm font-medium text-foreground">Качи снимки</label>
        <div className="mt-1.5">
          <BlobUploadInput
            multiple
            onUploaded={async (urls) => {
              await createStockPhotosFromUrls(urls, categoryId || null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
