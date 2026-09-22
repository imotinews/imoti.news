"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ChangePasswordState = { error?: string; success?: boolean };

const MIN_PASSWORD_LENGTH = 10;

export async function changeAdminPassword(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    throw new Error("Не сте влезли в системата.");
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < MIN_PASSWORD_LENGTH) {
    return { error: `Новата парола трябва да е поне ${MIN_PASSWORD_LENGTH} знака.` };
  }
  if (next !== confirm) {
    return { error: "Новата парола и потвърждението не съвпадат." };
  }
  if (next === current) {
    return { error: "Новата парола трябва да е различна от сегашната." };
  }

  const admin = await prisma.adminUser.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!admin || !(await bcrypt.compare(current, admin.passwordHash))) {
    return { error: "Сегашната парола не е вярна." };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });

  return { success: true };
}
