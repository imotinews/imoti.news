import Container from "@/components/layout/Container";
import ArticleCard from "@/components/articles/ArticleCard";
import { searchArticles } from "@/lib/mock-articles";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = searchArticles(q);

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Търсене
        </h1>

        <form method="get" className="mt-4 flex max-w-md gap-2">
          <label htmlFor="q" className="sr-only">
            Ключова дума
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Търси по ключова дума..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Търси
          </button>
        </form>
      </div>

      <div className="border-t border-border py-8">
        {q.trim() === "" ? (
          <p className="text-sm text-muted-foreground">
            Въведи ключова дума, за да намериш новини.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Няма намерени резултати за &quot;{q}&quot;.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "резултат" : "резултата"} за &quot;
              {q}&quot;
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
