import { prisma } from "@/lib/prisma";
import { sendDigest } from "@/lib/actions/newsletter-admin";

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  const [confirmedCount, pendingCount, recentArticles, recentSends] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.newsletterSubscriber.count({ where: { confirmed: false } }),
    prisma.article.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 15,
      include: { category: true },
    }),
    prisma.newsletterSend.findMany({ orderBy: { sentAt: "desc" }, take: 10 }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Бюлетин</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Потвърдени абонати</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{confirmedCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Чакащи потвърждение</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{pendingCount}</p>
        </div>
      </div>

      {sent === "1" && (
        <div className="mt-6 rounded-md border border-border bg-muted p-4 text-sm text-foreground">
          Бюлетинът е изпратен успешно.
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Нов бюлетин</h2>

        {confirmedCount === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Все още няма потвърдени абонати — изпращането ще се отключи, щом има поне един.
          </p>
        ) : (
          <form action={sendDigest} className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="subject" className="mb-1 block text-sm font-medium text-foreground">
                Тема на писмото *
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="Новини за имоти тази седмица"
                className="w-full max-w-lg rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Избери новини за включване *
              </p>
              <div className="max-w-lg space-y-2 rounded-md border border-border bg-background p-3">
                {recentArticles.length === 0 && (
                  <p className="text-sm text-muted-foreground">Няма публикувани новини.</p>
                )}
                {recentArticles.map((article) => (
                  <label key={article.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="articleIds"
                      value={article.id}
                      className="mt-1 h-4 w-4 rounded border-border"
                    />
                    <span>
                      <span className="text-foreground">{article.title}</span>
                      {article.category && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {article.category.name}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Изпрати до {confirmedCount} абонати
            </button>
          </form>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">История на изпращанията</h2>
        {recentSends.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Все още няма изпратени бюлетини.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Тема</th>
                  <th className="px-4 py-3 font-medium">Получатели</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {recentSends.map((send) => (
                  <tr key={send.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{send.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground">{send.recipientCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(send.sentAt).toLocaleDateString("bg-BG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
