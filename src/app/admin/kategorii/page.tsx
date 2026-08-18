import { prisma } from "@/lib/prisma";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Категории</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Категориите се появяват автоматично в менюто, футъра и на сайта. "Разрешена за скрейпъра"
        означава AI-то може само да класифицира статии там при скрейпване — изключи я за
        категории, предвидени само за ръчно публикуване (напр. Галерии).
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Име</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Разрешена за скрейпъра</th>
              <th className="px-4 py-3 font-medium">Статии</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <form
                    action={updateCategory.bind(null, category.id)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      name="name"
                      defaultValue={category.name}
                      className="w-40 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        name="scrapable"
                        defaultChecked={category.scrapable}
                        className="h-4 w-4"
                      />
                      скрейпър
                    </label>
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      Запази
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-muted-foreground">/{category.slug}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {category.scrapable ? "Да" : "Не"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{category._count.articles}</td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteCategory(category.id);
                    }}
                  >
                    <button
                      type="submit"
                      disabled={category._count.articles > 0}
                      className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                      title={
                        category._count.articles > 0
                          ? "Има статии в тази категория — премести ги първо"
                          : undefined
                      }
                    >
                      Изтрий
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 max-w-md rounded-lg border border-border bg-background p-4">
        <h2 className="text-sm font-semibold text-foreground">Нова категория</h2>
        <form action={createCategory} className="mt-3 space-y-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-foreground">
              Име
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="напр. Луксозни имоти"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label htmlFor="slug" className="block text-xs font-medium text-foreground">
              Slug (по желание — образува се автоматично от името)
            </label>
            <input
              id="slug"
              name="slug"
              placeholder="luksozni-imoti"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="scrapable" defaultChecked className="h-4 w-4" />
            Разрешена за скрейпъра
          </label>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Добави
          </button>
        </form>
      </div>
    </div>
  );
}
