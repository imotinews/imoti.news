import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteAd } from "@/lib/actions/ads";

const POSITION_LABELS: Record<string, string> = {
  header: "Header banner",
  sidebar: "Sidebar",
  in_article: "In-article",
  footer: "Footer banner",
};

export default async function AdminAdsPage() {
  const ads = await prisma.adBanner.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Реклами</h1>
        <Link
          href="/admin/reklami/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          + Нова реклама
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Име</th>
              <th className="px-4 py-3 font-medium">Позиция</th>
              <th className="px-4 py-3 font-medium">Активна</th>
              <th className="px-4 py-3 font-medium">Импресии / Кликове</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Няма добавени реклами.
                </td>
              </tr>
            )}
            {ads.map((ad) => (
              <tr key={ad.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{ad.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {POSITION_LABELS[ad.position] ?? ad.position}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      ad.active
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {ad.active ? "Да" : "Не"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ad.impressions} / {ad.clicks}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/reklami/${ad.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Редактирай
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteAd(ad.id);
                      }}
                    >
                      <button type="submit" className="text-red-600 hover:underline">
                        Изтрий
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
