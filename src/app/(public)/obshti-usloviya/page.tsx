import Container from "@/components/layout/Container";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Общи условия",
  description: "Общи условия за ползване на imoti.news.",
};

export default async function TermsPage() {
  const page = await prisma.siteContent.findUnique({ where: { slug: "obshti-usloviya" } });

  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {page?.title ?? "Общи условия"}
        </h1>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {page?.body}
        </p>
      </div>
    </Container>
  );
}
