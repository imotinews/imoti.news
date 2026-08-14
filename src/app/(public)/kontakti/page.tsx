import Container from "@/components/layout/Container";

export const metadata = {
  title: "Контакти",
  description: "Свържете се с екипа на imoti.news.",
};

export default function ContactsPage() {
  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Контакти</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          За въпроси и обратна връзка: <a href="mailto:info@imoti.news" className="text-primary hover:underline">info@imoti.news</a>
        </p>
      </div>
    </Container>
  );
}
