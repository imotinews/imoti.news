import Container from "@/components/layout/Container";

export const metadata = {
  title: "За нас",
  description: "Какво е imoti.news и как работим.",
};

export default function AboutPage() {
  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">За нас</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          imoti.news следи пазара на недвижими имоти в България — новини, анализи и тенденции
          от водещи източници, прегледани и преразказани на едно място, с ясно позоваване на
          оригинала при всяка статия.
        </p>
      </div>
    </Container>
  );
}
