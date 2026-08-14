export type Category = {
  slug: string;
  name: string;
};

export const CATEGORIES: Category[] = [
  { slug: "pazar-na-imoti", name: "Пазар на имоти" },
  { slug: "ipoteki-finansirane", name: "Ипотеки/Финансиране" },
  { slug: "stroitelstvo", name: "Строителство" },
  { slug: "regulatsii-zakoni", name: "Регулации/Закони" },
  { slug: "investitsii", name: "Инвестиции" },
  { slug: "mezhdunarodni-pazari", name: "Международни пазари" },
  { slug: "saveti-dizain", name: "Съвети и дизайн" },
];
