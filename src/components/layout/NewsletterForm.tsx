"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type SubscribeState } from "@/lib/actions/newsletter";

const initialState: SubscribeState = { status: "idle" };

export default function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  if (state.status === "success" || state.status === "already") {
    return <p className="text-sm text-primary">{state.message}</p>;
  }

  return (
    <div className="w-full max-w-sm">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Имейл адрес
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Твоят имейл"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "..." : "Абонирай се"}
        </button>
      </form>
      {state.status === "error" && (
        <p className="mt-2 text-xs text-red-600">{state.message}</p>
      )}
    </div>
  );
}
