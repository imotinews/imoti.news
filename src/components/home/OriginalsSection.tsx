import Link from "next/link";
import Container from "@/components/layout/Container";

// Placeholder editorial content -- there is no "story format" (analysis /
// data story / expert panel) field in the schema yet, and no articles
// tagged that way. Links point at the homepage until real Originals content
// exists; swap for real slugs once it does.

const ORIGINALS = [
  {
    tag: "АНАЛИЗ",
    tagClassName: "bg-primary",
    title: "София 2030: Как ще изглежда градът според днешните инвестиции",
    readMinutes: 6,
  },
  {
    tag: "DATA STORY",
    tagClassName: "bg-foreground",
    title: "Данните зад пазара: 10 графики, които трябва да знаете",
    readMinutes: 4,
  },
  {
    tag: "ЕКСПЕРТИ",
    tagClassName: "bg-[#6b5b2f]",
    title: "Къде са най-добрите възможности през 2026?",
    readMinutes: 6,
  },
];

export default function OriginalsSection() {
  return (
    <section className="border-t border-border py-10">
      <Container>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">
            imoti.news original
          </h2>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            Виж всички →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {ORIGINALS.map((item) => (
            <Link
              key={item.title}
              href="/"
              className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-foreground"
            >
              <span
                className={`absolute left-4 top-4 z-10 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${item.tagClassName}`}
              >
                {item.tag}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent transition-opacity group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-bold leading-snug text-white">{item.title}</h3>
                <span className="mt-2 block text-xs text-white/70">{item.readMinutes} min read</span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
