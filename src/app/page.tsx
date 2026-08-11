import Link from "next/link";
import Container from "@/components/layout/Container";
import { CATEGORIES } from "@/lib/categories";

const PLACEHOLDER_LEAD = {
  title: "Пример за водеща новина",
  excerpt:
    "Тук ще се показва най-важната новина на деня, преразказана в стил на редактор, с позоваване на оригиналния източник.",
  category: CATEGORIES[0],
};

const PLACEHOLDER_ARTICLES = Array.from({ length: 6 }).map((_, i) => ({
  id: i,
  title: `Пример за новина ${i + 1}`,
  excerpt: "Кратко резюме на новината ще се показва тук след включване на реални данни.",
  category: CATEGORIES[i % CATEGORIES.length],
}));

export default function Home() {
  return (
    <Container>
      <div className="py-8">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {PLACEHOLDER_LEAD.category.name}
        </span>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {PLACEHOLDER_LEAD.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          {PLACEHOLDER_LEAD.excerpt}
        </p>
      </div>

      <div className="border-t border-border py-8">
        <h2 className="text-lg font-semibold text-foreground">Последни новини</h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_ARTICLES.map((article) => (
            <Link
              key={article.id}
              href="#"
              className="flex flex-col rounded-lg border border-border p-4 transition-colors hover:border-primary"
            >
              <span className="text-xs font-medium text-primary">
                {article.category.name}
              </span>
              <h3 className="mt-2 text-base font-semibold text-foreground">
                {article.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}
