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
  { slug: "sabitiya", name: "Събития" },
  { slug: "galerii", name: "Галерии" },
];

// Категории, които скрейпърът/AI класификаторът има право да избира сам.
// "Галерии" е изключена нарочно — тя означава собствени снимки, качени
// ръчно от админа, не преразказан текст от чужд източник.
export const SCRAPABLE_CATEGORY_SLUGS = CATEGORIES.filter((c) => c.slug !== "galerii").map(
  (c) => c.slug
);
