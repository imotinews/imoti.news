"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import ArticleCard, { type ArticleCardData } from "@/components/articles/ArticleCard";

type GridArticle = ArticleCardData & { href?: string };

const PAGE_SIZE = 4;

export default function ArticleGrid({
  title,
  viewAllHref,
  articles,
  showPagination = false,
}: {
  title: string;
  viewAllHref: string;
  articles: GridArticle[];
  showPagination?: boolean;
}) {
  const [page, setPage] = useState(0);

  if (articles.length === 0) return null;

  const pageCount = Math.ceil(articles.length / PAGE_SIZE);
  const currentPage = Math.min(page, pageCount - 1);
  const visible = showPagination
    ? articles.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
    : articles.slice(0, PAGE_SIZE);

  return (
    <section className="border-t border-border py-10">
      <Container>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">{title}</h2>
          <Link
            href={viewAllHref}
            className="whitespace-nowrap text-sm font-medium text-primary hover:underline"
          >
            Виж всички →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {visible.map((article) => (
            <ArticleCard key={article.slug} article={article} href={article.href} />
          ))}
        </div>

        {showPagination && pageCount > 1 && (
          <div className="mt-6 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Предишни"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground/60 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Следващи"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground/60 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground/60"
            >
              ›
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
