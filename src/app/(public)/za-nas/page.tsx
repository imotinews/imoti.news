import Container from "@/components/layout/Container";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "За нас",
  description: "Какво е imoti.news и как работим.",
};

export default async function AboutPage() {
  const page = await prisma.siteContent.findUnique({ where: { slug: "za-nas" } });

  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {page?.title ?? "За нас"}
        </h1>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {page?.body}
        </p>
      </div>
    </Container>
  );
}
