import Link from "next/link";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import { confirmSubscription } from "@/lib/actions/newsletter";

export const metadata: Metadata = {
  title: "Потвърждение на абонамент",
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const confirmed = token ? await confirmSubscription(token) : false;

  return (
    <Container>
      <div className="mx-auto max-w-md py-16 text-center">
        {confirmed ? (
          <>
            <h1 className="text-2xl font-bold text-foreground">Абонаментът е потвърден!</h1>
            <p className="mt-3 text-muted-foreground">
              Благодарим ти — вече ще получаваш новини от imoti.news директно в пощата си.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">Невалиден или изтекъл линк</h1>
            <p className="mt-3 text-muted-foreground">
              Линкът за потвърждение не е валиден. Опитай да се абонираш отново.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Обратно към началната страница
        </Link>
      </div>
    </Container>
  );
}
