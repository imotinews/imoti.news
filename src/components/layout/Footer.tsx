import Link from "next/link";
import Container from "./Container";
import { prisma } from "@/lib/prisma";
import { getSocialLinks } from "@/lib/actions/social-links";

const INFO_LINKS = [
  { href: "/za-nas", label: "За нас" },
  { href: "/kontakti", label: "Контакти" },
  { href: "/reklama", label: "Реклама" },
  { href: "/obshti-usloviya", label: "Общи условия" },
  { href: "/poveritelnost", label: "Политика за поверителност" },
];

const SOCIAL_ICONS: Record<string, { label: string; icon: React.ReactNode }> = {
  facebook: {
    label: "Facebook",
    icon: (
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.36c-.26-.03-1.14-.11-2.17-.11-2.15 0-3.62 1.31-3.62 3.72V10.5H8.2v3h2.51V21h2.79Z" />
    ),
  },
  instagram: {
    label: "Instagram",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16.2" cy="7.8" r="0.9" />
      </>
    ),
  },
  x: {
    label: "X",
    icon: <path d="M4 4l7.2 9.4L4.4 20H7l5-5.6L16.5 20H20l-7.6-9.9L19.2 4H16.6l-4.6 5.1L8 4H4Zm3.1 1.6h1.9l8 10.8h-1.9l-8-10.8Z" />,
  },
  linkedin: {
    label: "LinkedIn",
    icon: (
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5a1.97 1.97 0 1 0 0 3.94 1.97 1.97 0 0 0 0-3.94ZM20.44 20h-3.37v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.97V20H9.68V8.5h3.24v1.57h.05c.45-.86 1.56-1.76 3.21-1.76 3.43 0 4.26 2.26 4.26 5.19V20Z" />
    ),
  },
  youtube: {
    label: "YouTube",
    icon: (
      <path d="M21.6 8.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 5 12 5 12 5s-3.9 0-6.7.2c-.4 0-1.3.1-2.1.9C2.6 6.7 2.4 8.2 2.4 8.2S2.2 10 2.2 11.7v.6c0 1.7.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9 1.7.2 7.4.2 7.4.2s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-.6c0-1.7-.2-3.5-.2-3.5ZM9.9 14.9V8.9l5.4 3-5.4 3Z" />
    ),
  },
  tiktok: {
    label: "TikTok",
    icon: (
      <path d="M16.6 5.2c.6.9 1.5 1.5 2.6 1.7v2.4c-1 0-2-.3-2.9-.8v6.1a5.1 5.1 0 1 1-4.4-5.1v2.5a2.6 2.6 0 1 0 1.9 2.5V3h2.6c0 .8.1 1.6.2 2.2Z" />
    ),
  },
  telegram: {
    label: "Telegram",
    icon: (
      <path d="M21.6 4.5 3.1 11.6c-1 .4-1 1.5.1 1.8l4.6 1.5 1.8 5.5c.2.6 1 .8 1.5.3l2.5-2.4 4.7 3.4c.7.5 1.7.1 1.9-.7l3-16.4c.2-.9-.7-1.6-1.6-1.1Zm-3.4 3.7L9.5 14.8l-.4 3.4-1.6-4.9 10.7-5.1Z" />
    ),
  },
  viber: {
    label: "Viber",
    icon: (
      <path d="M12.1 3.5c-4.6 0-8.3 3.3-8.3 7.7 0 2.5 1.2 4.8 3.2 6.3l-.5 3.1a.4.4 0 0 0 .6.5l3.3-1.7c.5.1 1.1.1 1.7.1 4.6 0 8.3-3.3 8.3-7.7s-3.7-8.3-8.3-8.3Zm4.2 10.6c-.2.5-1.1 1-1.5 1-.4 0-.9-.2-2.9-1.2-2.4-1.2-3.9-3.6-4-3.8-.1-.2-1-1.3-1-2.4 0-1.2.6-1.7.8-2 .2-.2.5-.3.6-.3h.5c.2 0 .4 0 .5.4l.7 1.9c.1.2 0 .4-.1.5l-.4.4c-.1.1-.2.3-.1.5.2.3.7 1.1 1.5 1.8.9.8 1.7 1.1 1.9 1.2.2.1.4.1.5-.1l.5-.6c.2-.2.4-.2.6-.1l1.7.9c.2.1.4.2.4.4 0 .2 0 .8-.2 1.3Z" />
    ),
  },
};

export default async function Footer() {
  const [categories, social] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getSocialLinks(),
  ]);

  const socialRecord = social as unknown as Record<string, string | null>;
  const activeSocial = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[])
    .map((key) => ({ key, url: socialRecord[key], ...SOCIAL_ICONS[key] }))
    .filter((s) => s.url);

  return (
    <footer className="mt-16 border-t border-border bg-background">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold tracking-tight text-foreground">IMOTI.NEWS</p>
            <p className="mt-3 text-sm text-muted-foreground">
              © {new Date().getFullYear()} IMOTI.NEWS. Всички права запазени.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Категории
            </p>
            <ul className="mt-3 space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/kategoriya/${category.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Информация
            </p>
            <ul className="mt-3 space-y-2">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {activeSocial.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Последвай ни
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {activeSocial.map((item) => (
                  <a
                    key={item.key}
                    href={item.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-primary hover:text-primary"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      {item.icon}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </footer>
  );
}
