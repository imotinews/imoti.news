import Container from "@/components/layout/Container";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Реклама",
  description: "Възможности за реклама в imoti.news.",
};

export default async function AdvertisePage() {
  const page = await prisma.siteContent.findUnique({ where: { slug: "reklama" } });

  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {page?.title ?? "Реклама"}
        </h1>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {page?.body}
        </p>
      </div>
    </Container>
  );
}
