import Container from "@/components/layout/Container";

export const metadata = {
  title: "Реклама",
  description: "Възможности за реклама в imoti.news.",
};

export default function AdvertisePage() {
  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Реклама</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          За рекламни възможности в imoti.news: <a href="mailto:info@imoti.news" className="text-primary hover:underline">info@imoti.news</a>
        </p>
      </div>
    </Container>
  );
}
