"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importArticleFromUrl, type ImportState } from "@/lib/actions/article-import";

export default function ImportFromUrlForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importArticleFromUrl, {});

  const fieldClass =
    "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground";

  return (
    <form action={formAction} className="max-w-2xl rounded-lg border border-border bg-muted/40 p-4">
      <h2 className="text-base font-bold text-foreground">Импортирай от линк</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Постави линк към статия или съобщение — текстът се извлича и се преразказва по същия начин
        като при автоматичните източници. Резултатът се запазва като чернова и се отваря за проверка.
        Тук не се пропускат материали като събития и анонси.
      </p>

      <div className="mt-4">
        <label htmlFor="import-url" className="block text-sm font-medium text-foreground">
          Линк
        </label>
        <input
          id="import-url"
          name="url"
          type="url"
          required
          placeholder="https://..."
          className={fieldClass}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="import-type" className="block text-sm font-medium text-foreground">
            Вид съдържание
          </label>
          <select id="import-type" name="contentType" defaultValue="real_estate" className={fieldClass}>
            <option value="real_estate">Новина от пазара на имоти</option>
            <option value="lifestyle">Съвети и дизайн (по-непринуден тон)</option>
          </select>
        </div>
        <div>
          <label htmlFor="import-source" className="block text-sm font-medium text-foreground">
            Име на източника (по желание)
          </label>
          <input
            id="import-source"
            name="sourceName"
            placeholder="Ако е празно — взема се от адреса"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Извличане и преразказ…" : "Импортирай и преразкажи"}
        </button>
        {pending && <span className="text-xs text-muted-foreground">Може да отнеме до половин минута.</span>}
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}{" "}
          {state.existingArticleId && (
            <Link
              href={`/admin/articles/${state.existingArticleId}/edit`}
              className="font-medium underline"
            >
              Отвори я
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
