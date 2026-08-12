import Link from "next/link";
import Container from "@/components/layout/Container";
import { unsubscribe } from "@/lib/actions/newsletter";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const removed = token ? await unsubscribe(token) : false;

  return (
    <Container>
      <div className="mx-auto max-w-md py-16 text-center">
        {removed ? (
          <>
            <h1 className="text-2xl font-bold text-foreground">Отписан/а си</h1>
            <p className="mt-3 text-muted-foreground">
              Няма да получаваш повече имейли от бюлетина на imoti.news. Можеш да се абонираш
              отново по всяко време.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">Невалиден линк</h1>
            <p className="mt-3 text-muted-foreground">
              Този линк за отписване не е валиден или вече е използван.
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
