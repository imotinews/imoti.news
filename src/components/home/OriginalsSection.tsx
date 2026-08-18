import Link from "next/link";
import Container from "@/components/layout/Container";
import { prisma } from "@/lib/prisma";
import { estimateReadMinutes } from "@/lib/article-helpers";

export default async function OriginalsSection() {
  const originals = await prisma.article.findMany({
    where: { status: "published", isOriginal: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Editorial content marked "imoti.news Original" in the admin panel --
  // hidden until at least one article is flagged, rather than showing
  // placeholder text as if it were real.
  if (originals.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border py-10">
      <Container>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">
            imoti.news original
          </h2>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {originals.map((article) => (
            <Link
              key={article.id}
              href={`/statia/${article.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-foreground"
            >
              <span className="absolute left-4 top-4 z-10 rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Original
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent transition-opacity group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-bold leading-snug text-white">{article.title}</h3>
                <span className="mt-2 block text-xs text-white/70">
                  {estimateReadMinutes(article.rewrittenContent)} min read
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
