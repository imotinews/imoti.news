import Container from "@/components/layout/Container";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Политика за поверителност",
  description: "Как imoti.news обработва лични данни.",
};

export default async function PrivacyPage() {
  const page = await prisma.siteContent.findUnique({ where: { slug: "poveritelnost" } });

  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {page?.title ?? "Политика за поверителност"}
        </h1>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {page?.body}
        </p>
      </div>
    </Container>
  );
}
