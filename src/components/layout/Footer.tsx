import Link from "next/link";
import Container from "./Container";
import NewsletterForm from "./NewsletterForm";
import { CATEGORIES } from "@/lib/categories";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold tracking-tight text-primary">
              imoti<span className="text-accent">.news</span>
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Новини от пазара на недвижими имоти в България — прегледани, преразказани и
              позовани на оригиналния източник.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Категории</p>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/kategoriya/${category.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Абонамент за бюлетин</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Топ новините за имоти всяка седмица в твоята пощенска кутия.
            </p>
            <div className="mt-3">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="border-t border-border py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} imoti.news. Всички права запазени.
        </div>
      </Container>
    </footer>
  );
}
