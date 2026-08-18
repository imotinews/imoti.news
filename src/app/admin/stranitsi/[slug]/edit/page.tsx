import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSiteContent } from "@/lib/actions/site-content";

export default async function EditSiteContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await prisma.siteContent.findUnique({ where: { slug } });

  if (!page) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Редакция: {page.title}
      </h1>

      <form action={updateSiteContent.bind(null, page.slug)} className="mt-6 max-w-2xl space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Заглавие
          </label>
          <input
            id="title"
            name="title"
            defaultValue={page.title}
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-foreground">
            Текст
          </label>
          <textarea
            id="body"
            name="body"
            defaultValue={page.body}
            required
            rows={12}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Запази
        </button>
      </form>
    </div>
  );
}
