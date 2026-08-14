"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type SubscribeState } from "@/lib/actions/newsletter";
import Container from "@/components/layout/Container";

const initialState: SubscribeState = { status: "idle" };

export default function NewsletterBlock() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <section id="newsletter" className="bg-muted py-12">
      <Container>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="mt-1 h-7 w-7 shrink-0 text-foreground"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
            </svg>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Абонирайте се за нашия бюлетин
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Най-важното от света на имотите — всяка седмица в имейла ви.
              </p>
            </div>
          </div>

          {state.status === "success" || state.status === "already" ? (
            <p className="text-sm font-medium text-primary">{state.message}</p>
          ) : (
            <div className="w-full sm:w-auto">
              <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="newsletter-block-email" className="sr-only">
                  Имейл адрес
                </label>
                <input
                  id="newsletter-block-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Вашият имейл"
                  className="w-full min-w-[240px] rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="shrink-0 rounded-md bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "..." : "Абонирай се"}
                </button>
              </form>
              {state.status === "error" && (
                <p className="mt-2 text-xs text-red-600">{state.message}</p>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
