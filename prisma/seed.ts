import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { CATEGORIES } from "../src/lib/categories";

const prisma = new PrismaClient();

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { slug: category.slug, name: category.name },
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "ivaylomollov@gmail.com";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    console.log(`Admin user ${adminEmail} already exists, skipping.`);
    return;
  }

  const password = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.create({
    data: { email: adminEmail, passwordHash, role: "admin" },
  });

  console.log("\n=== ADMIN LOGIN (shown once, save it now) ===");
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${password}`);
  console.log("===============================================\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
