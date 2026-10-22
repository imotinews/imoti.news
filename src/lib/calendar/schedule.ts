export type HandlerResult = {
  status: "created" | "nothing_new" | "error";
  message: string;
  articleId?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// The next occurrence of `weekday` (0 = Sunday ... 6 = Saturday) strictly
// after `from`, at 07:00 UTC (the calendar cron's hour).
export function nextWeekdayAfter(weekday: number, from: Date): Date {
  const base = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 7, 0, 0));
  let delta = (weekday - base.getUTCDay() + 7) % 7;
  if (delta === 0 && base.getTime() <= from.getTime()) delta = 7;
  return new Date(base.getTime() + delta * DAY_MS);
}

export function computeNextExpected(
  schedule: { cadence: string; weekday: number | null },
  from: Date
): Date | null {
  if (schedule.cadence === "weekly" && schedule.weekday !== null) {
    return nextWeekdayAfter(schedule.weekday, from);
  }
  return null;
}

// If the expected item has not shown up this many days after its expected
// day, stop waiting for it and move on to the next occurrence.
export const MISSED_AFTER_DAYS = 3;
