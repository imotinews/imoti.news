import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminSiteContentPage() {
  const pages = await prisma.siteContent.findMany({ orderBy: { title: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Статични страници</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Текстовете на страниците За нас, Контакти, Реклама, Общи условия и Политика за
        поверителност, видими на живия сайт.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Страница</th>
              <th className="px-4 py-3 font-medium">Последна редакция</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  {page.title}
                  <div className="text-xs text-muted-foreground">/{page.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {page.updatedAt.toLocaleString("bg-BG")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/stranitsi/${page.slug}/edit`}
                    className="text-primary hover:underline"
                  >
                    Редактирай
                  </Link>
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-3 text-foreground">
                Социални мрежи
                <div className="text-xs text-muted-foreground">линкове към твоите канали</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">—</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href="/admin/stranitsi/sotsialni-mrezhi"
                  className="text-primary hover:underline"
                >
                  Редактирай
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
