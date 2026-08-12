"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL, siteUrl } from "@/lib/newsletter/resend-client";
import { digestEmail, type DigestArticle } from "@/lib/newsletter/templates";

async function requireAdmin() {
  const session = await auth();
  if (!session) {
    throw new Error("Не сте влезли в системата.");
  }
}

const BATCH_SIZE = 100;

export async function sendDigest(formData: FormData) {
  await requireAdmin();

  const subject = String(formData.get("subject") ?? "").trim();
  const articleIds = formData.getAll("articleIds").map(String);

  if (!subject || articleIds.length === 0) {
    throw new Error("Моля, въведи тема и избери поне една новина.");
  }

  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    include: { category: true },
  });

  const digestArticles: DigestArticle[] = articles.map((article) => ({
    title: article.title,
    excerpt: article.excerpt,
    url: siteUrl(`/statia/${article.slug}`),
    categoryName: article.category?.name ?? null,
  }));

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { confirmed: true },
  });

  if (subscribers.length === 0) {
    throw new Error("Няма потвърдени абонати за изпращане.");
  }

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const emails = batch.map((subscriber) => {
      const unsubscribeUrl = siteUrl(`/otpisvane?token=${subscriber.token}`);
      const { subject: emailSubject, html } = digestEmail(subject, digestArticles, unsubscribeUrl);

      return {
        from: FROM_EMAIL,
        to: subscriber.email,
        subject: emailSubject,
        html,
      };
    });

    const { error } = await resend.batch.send(emails);

    if (error) {
      console.error("[newsletter] Resend rejected digest batch:", error);
      throw new Error(`Изпращането се провали: ${error.message}`);
    }
  }

  await prisma.newsletterSend.create({
    data: { subject, recipientCount: subscribers.length },
  });

  revalidatePath("/admin/byuletin");
  redirect("/admin/byuletin?sent=1");
}
