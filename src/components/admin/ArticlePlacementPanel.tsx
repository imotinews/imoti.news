import { updateArticlePlacement } from "@/lib/actions/articles";

export default function ArticlePlacementPanel({
  articleId,
  isHero,
  isFeatured,
  isOriginal,
}: {
  articleId: string;
  isHero: boolean;
  isFeatured: boolean;
  isOriginal: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-foreground">Начална страница</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Контролира къде се появява статията на началната страница.
      </p>
      <form action={updateArticlePlacement.bind(null, articleId)} className="mt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="isHero" defaultChecked={isHero} className="h-4 w-4" />
          Hero (главна статия) — само една активна наведнъж
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="isFeatured" defaultChecked={isFeatured} className="h-4 w-4" />
          Featured (открояваща се)
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="isOriginal" defaultChecked={isOriginal} className="h-4 w-4" />
          imoti.news Original
        </label>
        <button
          type="submit"
          className="mt-2 w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Запази
        </button>
      </form>
    </div>
  );
}
