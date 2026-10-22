"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { runScheduleNow, type RunScheduleState } from "@/lib/actions/calendar";

export default function ScheduleRunButton({ id }: { id: string }) {
  const router = useRouter();

  async function action(prev: RunScheduleState, formData: FormData): Promise<RunScheduleState> {
    const result = await runScheduleNow(prev, formData);
    router.refresh();
    return result;
  }

  const [state, formAction, pending] = useActionState<RunScheduleState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Изпълнява се…" : "Пусни сега"}
      </button>
      {state.message && (
        <span
          className={`max-w-xs text-right text-xs ${state.status === "error" ? "text-red-700" : "text-muted-foreground"}`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
