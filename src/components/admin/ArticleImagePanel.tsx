"use client";

import { useActionState, useRef } from "react";
import {
  uploadArticleImage,
  setArticleImageFromUrl,
  generateArticleImage,
  removeArticleImage,
  type ImageActionState,
} from "@/lib/actions/articles";

const initialState: ImageActionState = { status: "idle" };

export default function ArticleImagePanel({
  articleId,
  imageUrl,
}: {
  articleId: string;
  imageUrl: string | null;
}) {
  const uploadAction = uploadArticleImage.bind(null, articleId);
  const urlAction = setArticleImageFromUrl.bind(null, articleId);
  const generateAction = generateArticleImage.bind(null, articleId);

  const [uploadState, uploadFormAction, uploadPending] = useActionState(uploadAction, initialState);
  const [urlState, urlFormAction, urlPending] = useActionState(urlAction, initialState);
  const [genState, genFormAction, genPending] = useActionState(generateAction, initialState);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-foreground">Изображение</h2>

      {imageUrl && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
          <form action={async () => { await removeArticleImage(articleId); }} className="mt-2">
            <button type="submit" className="text-xs text-red-600 hover:underline">
              Премахни снимката
            </button>
          </form>
        </div>
      )}

      <div className="mt-4 space-y-4 border-t border-border pt-4">
        <form
          action={(formData) => {
            uploadFormAction(formData);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          <label className="block text-xs font-medium text-foreground">Качи от компютъра</label>
          <input
            ref={fileInputRef}
            type="file"
            name="imageFile"
            accept="image/*"
            className="mt-1.5 block w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-muted file:px-2 file:py-1 file:text-xs"
          />
          <button
            type="submit"
            disabled={uploadPending}
            className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {uploadPending ? "Качва се..." : "Качи"}
          </button>
          {uploadState.status === "error" && (
            <p className="mt-1 text-xs text-red-600">{uploadState.message}</p>
          )}
        </form>

        <form action={urlFormAction}>
          <label htmlFor="sourceUrl" className="block text-xs font-medium text-foreground">
            Извлечи от URL
          </label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            placeholder="https://..."
            className="mt-1.5 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={urlPending}
            className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {urlPending ? "Извлича се..." : "Извлечи"}
          </button>
          {urlState.status === "error" && (
            <p className="mt-1 text-xs text-red-600">{urlState.message}</p>
          )}
        </form>

        <form action={genFormAction}>
          <button
            type="submit"
            disabled={genPending}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {genPending ? "Генерира се... (може да отнеме време)" : "Генерирай с AI"}
          </button>
          {genState.status === "error" && (
            <p className="mt-1 text-xs text-red-600">{genState.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
