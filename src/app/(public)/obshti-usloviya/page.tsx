import Container from "@/components/layout/Container";

export const metadata = {
  title: "Общи условия",
  description: "Общи условия за ползване на imoti.news.",
};

export default function TermsPage() {
  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Общи условия</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Съдържанието в imoti.news е преразказано от оригинални източници, с изрично
          позоваване на всяка статия. Използвайки сайта, приемате, че съдържанието се
          предоставя с информационна цел.
        </p>
      </div>
    </Container>
  );
}
