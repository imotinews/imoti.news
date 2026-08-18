import Link from "next/link";
import { publishArticle, unpublishArticle } from "@/lib/actions/articles";

export default function ArticleActionsPanel({
  article,
  secondaryHref,
  secondaryLabel,
}: {
  article: { id: string; status: string; slug: string };
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-foreground">Действия</h2>

      <div className="mt-3 flex flex-col gap-2">
        {article.status === "published" ? (
          <form
            action={async () => {
              "use server";
              await unpublishArticle(article.id);
            }}
          >
            <button
              type="submit"
              className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Върни в чернова
            </button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server";
              await publishArticle(article.id);
            }}
          >
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              Публикувай сега
            </button>
          </form>
        )}

        <Link
          href={secondaryHref}
          className="w-full rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {secondaryLabel}
        </Link>

        {article.status === "published" && (
          <Link
            href={`/statia/${article.slug}`}
            target="_blank"
            className="w-full rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Виж на живо ↗
          </Link>
        )}
      </div>
    </div>
  );
}
