import Link from "next/link";
import Container from "./Container";
import MobileMenu from "./MobileMenu";
import { prisma } from "@/lib/prisma";

export default async function Header() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <header className="border-b border-border bg-background">
      <Container>
        <div className="flex items-center justify-between gap-6 py-5">
          <Link href="/" className="block">
            <span className="text-xl font-bold tracking-tight text-foreground">IMOTI.NEWS</span>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Real Estate · Architecture · Hospitality · Design · Cities
            </div>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/tarsene"
              aria-label="Търсене"
              className="hidden h-9 w-9 items-center justify-center text-foreground/70 transition-colors hover:text-primary sm:flex"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>

            <Link
              href="/#newsletter"
              className="hidden text-sm font-medium text-foreground/80 transition-colors hover:text-primary sm:block"
            >
              Newsletter
            </Link>

            <Link
              href="/za-nas"
              className="hidden text-sm font-medium text-foreground/80 transition-colors hover:text-primary sm:block"
            >
              За нас
            </Link>

            <MobileMenu categories={categories} />
          </div>
        </div>

        <nav className="hidden items-center gap-6 overflow-x-auto pb-4 md:flex">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/kategoriya/${category.slug}`}
              className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-foreground/80 transition-colors hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
