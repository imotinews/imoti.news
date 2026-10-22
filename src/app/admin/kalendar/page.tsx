import { prisma } from "@/lib/prisma";
import { toggleSchedule } from "@/lib/actions/calendar";
import ScheduleRunButton from "@/components/admin/ScheduleRunButton";

// "Пусни сега" reads a PDF and asks AI for a few headlines -- more than the default.
export const maxDuration = 60;

const WEEKDAYS = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];

const STATUS_LABEL: Record<string, string> = {
  created: "създадена чернова",
  nothing_new: "няма нищо ново",
  error: "грешка",
};

function cadenceText(cadence: string, weekday: number | null): string {
  if (cadence === "weekly" && weekday !== null) return `всяка седмица, ${WEEKDAYS[weekday]}`;
  return cadence;
}

export default async function AdminCalendarPage() {
  const schedules = await prisma.publicationSchedule.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Календар на публикациите</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Повтарящи се неща, за които знаем, че идват. В очаквания ден системата проверява реалния източник и
        прави чернова само ако наистина има нещо ново. Нищо не се публикува само.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Какво</th>
              <th className="px-4 py-3 font-medium">Ритъм</th>
              <th className="px-4 py-3 font-medium">Следва</th>
              <th className="px-4 py-3 font-medium">Последно</th>
              <th className="px-4 py-3 font-medium">Активен</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Няма записи в календара.
                </td>
              </tr>
            )}
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3 text-foreground">
                  {schedule.name}
                  {schedule.notes && <div className="mt-1 max-w-sm text-xs text-muted-foreground">{schedule.notes}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{cadenceText(schedule.cadence, schedule.weekday)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {schedule.nextExpectedAt ? schedule.nextExpectedAt.toLocaleDateString("bg-BG") : "-"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {schedule.lastRunAt ? (
                    <>
                      <div>{schedule.lastRunAt.toLocaleString("bg-BG")}</div>
                      <div className="mt-1 font-medium text-foreground">
                        {STATUS_LABEL[schedule.lastStatus ?? ""] ?? schedule.lastStatus}
                      </div>
                      {schedule.lastMessage && <div className="mt-1 max-w-xs">{schedule.lastMessage}</div>}
                    </>
                  ) : (
                    "Още не е пускано"
                  )}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      "use server";
                      await toggleSchedule(schedule.id);
                    }}
                  >
                    <button
                      type="submit"
                      className={
                        schedule.active
                          ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {schedule.active ? "Да" : "Не"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <ScheduleRunButton id={schedule.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
