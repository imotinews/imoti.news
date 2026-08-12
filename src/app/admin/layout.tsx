import Link from "next/link";
import type { Metadata } from "next";
import { auth, signOut } from "@/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    return <div className="min-h-screen bg-muted">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-bold tracking-tight text-primary">
              imoti.news · Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-foreground/80 hover:text-primary">
                Табло
              </Link>
              <Link href="/admin/articles" className="text-foreground/80 hover:text-primary">
                Новини
              </Link>
              <Link href="/admin/reklami" className="text-foreground/80 hover:text-primary">
                Реклами
              </Link>
              <Link href="/admin/sources" className="text-foreground/80 hover:text-primary">
                Източници
              </Link>
              <Link href="/admin/byuletin" className="text-foreground/80 hover:text-primary">
                Бюлетин
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">{session.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Изход
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
