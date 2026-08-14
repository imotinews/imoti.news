import Container from "@/components/layout/Container";

export const metadata = {
  title: "Политика за поверителност",
  description: "Как imoti.news обработва лични данни.",
};

export default function PrivacyPage() {
  return (
    <Container>
      <div className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Политика за поверителност
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          imoti.news събира само имейл адрес при абонамент за бюлетин, с потвърждение
          (double opt-in) и лесна отписка при всяко писмо. Не споделяме данни с трети страни.
        </p>
      </div>
    </Container>
  );
}
