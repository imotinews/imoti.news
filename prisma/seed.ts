import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { CATEGORIES } from "../src/lib/categories";

const prisma = new PrismaClient();

const SOURCES = [
  {
    name: "Investor.bg — Имоти",
    url: "https://www.investor.bg/rss/c/109-imoti",
    type: "rss" as const,
  },
  {
    name: "Investor.bg — Строителство и имоти",
    url: "https://www.investor.bg/rss/c/533-stroitelstvo-i-imoti",
    type: "rss" as const,
  },
  {
    name: "Plovdiv24.bg",
    url: "https://www.plovdiv24.bg/rss.php?op=top",
    type: "rss" as const,
  },
  {
    name: "Bulgaria ON AIR",
    url: "https://www.bgonair.bg/rss/c/2-bulgaria",
    type: "rss" as const,
  },
  {
    name: "Imoti.net — Новини",
    url: "https://www.imoti.net/en/polezno/news",
    type: "scrape" as const,
  },
  {
    name: "Money.bg — Имоти",
    url: "https://money.bg/property",
    type: "scrape" as const,
  },
];

async function seedCategories() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { slug: category.slug, name: category.name },
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);
}

async function seedAdmin() {
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

async function seedSources() {
  for (const source of SOURCES) {
    const existing = await prisma.source.findFirst({ where: { url: source.url } });
    if (existing) continue;

    await prisma.source.create({ data: source });
  }
  console.log(`Seeded sources (${SOURCES.length} candidates, skipped any already present).`);
}

async function main() {
  await seedCategories();
  await seedAdmin();
  await seedSources();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
