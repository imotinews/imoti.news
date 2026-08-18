import { getSocialLinks, updateSocialLinks } from "@/lib/actions/social-links";

const FIELDS: { name: keyof Awaited<ReturnType<typeof getSocialLinks>>; label: string }[] = [
  { name: "facebook", label: "Facebook" },
  { name: "instagram", label: "Instagram" },
  { name: "x", label: "X (Twitter)" },
  { name: "linkedin", label: "LinkedIn" },
  { name: "youtube", label: "YouTube" },
  { name: "tiktok", label: "TikTok" },
  { name: "telegram", label: "Telegram" },
  { name: "viber", label: "Viber" },
];

export default async function AdminSocialLinksPage() {
  const social = await getSocialLinks();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Социални мрежи</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Постави линк само за каналите, които наистина ползваш — на сайта се показват само
        попълнените, останалите остават скрити.
      </p>

      <form action={updateSocialLinks} className="mt-6 max-w-md space-y-3">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-foreground">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type="url"
              defaultValue={(social[field.name] as string | null) ?? ""}
              placeholder="https://..."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        ))}

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Запази
        </button>
      </form>
    </div>
  );
}
