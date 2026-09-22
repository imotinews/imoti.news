"use client";

import { useActionState } from "react";
import { changeAdminPassword, type ChangePasswordState } from "@/lib/actions/admin-account";

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changeAdminPassword,
    {}
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
          Сегашна парола
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
          Нова парола
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">Поне 10 знака.</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Повтори новата парола
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Запазване…" : "Смени паролата"}
      </button>

      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-primary" role="status">
          Паролата е сменена. Ползвай новата при следващия вход.
        </p>
      )}
    </form>
  );
}
