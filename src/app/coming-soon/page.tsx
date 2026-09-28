import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "imoti.news — очаквайте скоро",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="text-2xl font-bold tracking-tight text-foreground">IMOTI.NEWS</span>
      <h1 className="mt-6 text-xl font-semibold text-foreground">Очаквайте скоро</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Сайтът временно не е достъпен. Ще се завърнем съвсем скоро.
      </p>
    </div>
  );
}
