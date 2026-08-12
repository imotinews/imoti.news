"use server";

import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL, siteUrl } from "@/lib/newsletter/resend-client";
import { confirmationEmail } from "@/lib/newsletter/templates";

export type SubscribeState = {
  status: "idle" | "success" | "already" | "error";
  message?: string;
};

export async function subscribeToNewsletter(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Моля, въведи валиден имейл адрес." };
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  if (existing?.confirmed) {
    return { status: "already", message: "Този имейл вече е абониран." };
  }

  const subscriber =
    existing ??
    (await prisma.newsletterSubscriber.create({
      data: { email },
    }));

  const confirmUrl = siteUrl(`/potvardi?token=${subscriber.token}`);
  const { subject, html } = confirmationEmail(confirmUrl);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("[newsletter] Resend rejected confirmation email:", error);
      return {
        status: "error",
        message: "Неуспешно изпращане на имейл за потвърждение. Опитай отново по-късно.",
      };
    }
  } catch (error) {
    console.error("[newsletter] failed to send confirmation email:", error);
    return {
      status: "error",
      message: "Неуспешно изпращане на имейл за потвърждение. Опитай отново по-късно.",
    };
  }

  return {
    status: "success",
    message: "Провери пощата си и потвърди абонамента.",
  };
}

export async function confirmSubscription(token: string): Promise<boolean> {
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { token } });
  if (!subscriber) return false;

  await prisma.newsletterSubscriber.update({
    where: { token },
    data: { confirmed: true },
  });

  return true;
}

export async function unsubscribe(token: string): Promise<boolean> {
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { token } });
  if (!subscriber) return false;

  await prisma.newsletterSubscriber.delete({ where: { token } });
  return true;
}
