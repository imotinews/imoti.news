import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeNextExpected, MISSED_AFTER_DAYS, type HandlerResult } from "./schedule";
import { runVestnikStroitelIssue } from "./handlers/vestnik-stroitel";
import { runMarketPulse } from "./handlers/market-pulse";

const DAY_MS = 24 * 60 * 60 * 1000;

const HANDLERS: Record<string, () => Promise<HandlerResult>> = {
  "vestnik-stroitel-issue": runVestnikStroitelIssue,
  "market-pulse": runMarketPulse,
};

// Runs one schedule's detector against the real source and records what
// happened. A draft is only ever created when the detector found something.
export async function runSchedule(id: string): Promise<HandlerResult> {
  const schedule = await prisma.publicationSchedule.findUniqueOrThrow({ where: { id } });
  const handler = HANDLERS[schedule.detector];
  const now = new Date();

  let result: HandlerResult;
  if (!handler) {
    result = { status: "error", message: `Непознат детектор: ${schedule.detector}` };
  } else {
    try {
      result = await handler();
    } catch (error) {
      result = { status: "error", message: (error as Error).message };
    }
  }

  const data: Prisma.PublicationScheduleUpdateInput = {
    lastRunAt: now,
    lastStatus: result.status,
    lastMessage: result.message.slice(0, 500),
  };

  if (result.status === "created") {
    data.lastSuccessAt = now;
    data.nextExpectedAt = computeNextExpected(schedule, now);
  } else if (
    result.status === "nothing_new" &&
    schedule.nextExpectedAt &&
    now.getTime() - schedule.nextExpectedAt.getTime() > MISSED_AFTER_DAYS * DAY_MS
  ) {
    data.nextExpectedAt = computeNextExpected(schedule, now);
  }

  await prisma.publicationSchedule.update({ where: { id }, data });
  return result;
}

export async function runDueSchedules(): Promise<{ name: string; result: HandlerResult }[]> {
  const due = await prisma.publicationSchedule.findMany({
    where: { active: true, nextExpectedAt: { lte: new Date() } },
    orderBy: { nextExpectedAt: "asc" },
  });

  const results: { name: string; result: HandlerResult }[] = [];
  for (const schedule of due) {
    results.push({ name: schedule.name, result: await runSchedule(schedule.id) });
  }
  return results;
}
