import { siteUrl } from "./resend-client";

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#1e3a5f;padding:20px 24px;">
          <span style="color:#ffffff;font-size:18px;font-weight:bold;">imoti<span style="color:#b45309;">.news</span></span>
        </td></tr>
        <tr><td style="padding:24px;color:#171717;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f4f4f5;color:#6b7280;font-size:12px;">
          © ${new Date().getFullYear()} imoti.news
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function confirmationEmail(confirmUrl: string): { subject: string; html: string } {
  return {
    subject: "Потвърди абонамента си за imoti.news",
    html: emailShell(`
      <p>Здравей,</p>
      <p>Само още една стъпка — потвърди имейл адреса си, за да получаваш новини за пазара на недвижими имоти от imoti.news.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${confirmUrl}" style="background:#1e3a5f;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Потвърди абонамента</a>
      </p>
      <p style="color:#6b7280;font-size:13px;">Ако не си заявявал/а този абонамент, просто игнорирай това писмо.</p>
    `),
  };
}

export type DigestArticle = {
  title: string;
  excerpt: string | null;
  url: string;
  categoryName: string | null;
};

export function digestEmail(
  subject: string,
  articles: DigestArticle[],
  unsubscribeUrl: string
): { subject: string; html: string } {
  const items = articles
    .map(
      (a) => `
      <tr><td style="padding:14px 0;border-top:1px solid #e4e4e7;">
        ${a.categoryName ? `<div style="color:#1e3a5f;font-size:12px;font-weight:bold;margin-bottom:4px;">${a.categoryName}</div>` : ""}
        <a href="${a.url}" style="color:#171717;font-size:16px;font-weight:bold;text-decoration:none;">${a.title}</a>
        ${a.excerpt ? `<p style="color:#6b7280;font-size:14px;margin:6px 0 0;">${a.excerpt}</p>` : ""}
      </td></tr>`
    )
    .join("");

  return {
    subject,
    html: emailShell(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${items}
      </table>
      <p style="text-align:center;margin-top:28px;">
        <a href="${siteUrl("/")}" style="color:#1e3a5f;">Виж всички новини на imoti.news →</a>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;">Отпиши се от бюлетина</a>
      </p>
    `),
  };
}
