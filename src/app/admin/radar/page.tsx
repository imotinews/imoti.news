import { prisma } from "@/lib/prisma";

const WINDOW_DAYS = 14;

export default async function AdminRadarPage() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const signals = await prisma.scrapedUrl.findMany({
    where: { status: "signal", createdAt: { gte: since } },
    include: { source: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Радар на теми</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Теми от източници, от които не публикуваме текст. Тук се вижда само заглавието като сигнал, че
        нещо се е случило. Намери първоизточника (официални данни, прессъобщение, самата институция или
        фирма) и пиши от него.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Кога</th>
              <th className="px-4 py-3 font-medium">Заглавие</th>
              <th className="px-4 py-3 font-medium">Източник</th>
            </tr>
          </thead>
          <tbody>
            {signals.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  Още няма сигнали за последните {WINDOW_DAYS} дни.
                </td>
              </tr>
            )}
            {signals.map((signal) => (
              <tr key={signal.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {signal.createdAt.toLocaleString("bg-BG")}
                </td>
                <td className="px-4 py-3 text-foreground">
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {signal.title ?? signal.url}
                  </a>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{signal.source?.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
