import Link from "next/link";
import Container from "./Container";
import MobileMenu from "./MobileMenu";
import { prisma } from "@/lib/prisma";

const CATEGORY_NAV_ORDER = [
  "pazar-na-imoti",
  "stroitelstvo",
  "ipoteki-finansirane",
  "regulatsii-zakoni",
  "investitsii",
  "mezhdunarodni-pazari",
  "saveti-dizain",
  "galerii",
];

export default async function Header() {
  const categories = (await prisma.category.findMany({ orderBy: { name: "asc" } })).sort(
    (a, b) => {
      const ai = CATEGORY_NAV_ORDER.indexOf(a.slug);
      const bi = CATEGORY_NAV_ORDER.indexOf(b.slug);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
  );

  return (
    <>
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
        </Container>
      </header>

      <div className="sticky top-0 z-40 hidden border-b border-border bg-background md:block">
        <Container>
          <nav className="no-scrollbar flex items-center gap-x-4 overflow-x-auto py-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/kategoriya/${category.slug}`}
                className="shrink-0 whitespace-nowrap text-[11px] font-semibold uppercase text-foreground/80 transition-colors hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </>
  );
}
