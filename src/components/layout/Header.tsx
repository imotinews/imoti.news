import Link from "next/link";
import Container from "./Container";
import { CATEGORIES } from "@/lib/categories";

export default function Header() {
  return (
    <header className="border-b border-border bg-background">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
            imoti<span className="text-accent">.news</span>
          </Link>

          <nav className="hidden items-center gap-5 overflow-x-auto lg:flex">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/kategoriya/${category.slug}`}
                className="whitespace-nowrap text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <Link
            href="/tarsene"
            aria-label="Търсене"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-primary hover:text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>
        </div>

        <nav className="flex items-center gap-4 overflow-x-auto pb-3 lg:hidden">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/kategoriya/${category.slug}`}
              className="whitespace-nowrap text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
