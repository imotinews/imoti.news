// Seed-only starting set -- the database (Category table) is the real
// source of truth from here on; admins can add/rename/delete categories
// and toggle "scrapable" from /admin/kategorii. This list only seeds a
// fresh database and is never re-applied on top of admin edits.
export type SeedCategory = {
  slug: string;
  name: string;
  scrapable?: boolean;
};

export const CATEGORIES: SeedCategory[] = [
  { slug: "pazar-na-imoti", name: "Пазар на имоти" },
  { slug: "ipoteki-finansirane", name: "Ипотеки/Финансиране" },
  { slug: "stroitelstvo", name: "Строителство" },
  { slug: "regulatsii-zakoni", name: "Регулации/Закони" },
  { slug: "investitsii", name: "Инвестиции" },
  { slug: "mezhdunarodni-pazari", name: "Международни пазари" },
  { slug: "saveti-dizain", name: "Съвети и дизайн" },
  { slug: "sabitiya", name: "Събития" },
  { slug: "galerii", name: "Галерии", scrapable: false },
];
