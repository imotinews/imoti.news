import { Resend } from "resend";

// Resend's constructor throws immediately on a missing key, which would crash
// the build/import of any page that pulls this module in before RESEND_API_KEY
// is configured. Fall back to a placeholder so import always succeeds; actual
// send calls will fail with a clear auth error, handled at the call site.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_not_configured");

export const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL ?? "imoti.news <onboarding@resend.dev>";

export function siteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  return `${base}${path}`;
}
