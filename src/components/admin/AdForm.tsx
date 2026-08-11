export type AdFormValues = {
  name: string;
  position: "header" | "sidebar" | "in_article" | "footer";
  imageUrl: string | null;
  htmlCode: string | null;
  targetUrl: string | null;
  active: boolean;
  startDate: Date | null;
  endDate: Date | null;
};

const POSITION_LABELS: Record<AdFormValues["position"], string> = {
  header: "Header banner",
  sidebar: "Sidebar",
  in_article: "In-article",
  footer: "Footer banner",
};

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default function AdForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<AdFormValues>;
}) {
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
          Име *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="position" className="mb-1 block text-sm font-medium text-foreground">
          Позиция
        </label>
        <select
          id="position"
          name="position"
          defaultValue={defaultValues?.position ?? "header"}
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {Object.entries(POSITION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-foreground">
          Линк към изображение
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={defaultValues?.imageUrl ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="targetUrl" className="mb-1 block text-sm font-medium text-foreground">
          Линк при клик
        </label>
        <input
          id="targetUrl"
          name="targetUrl"
          type="url"
          defaultValue={defaultValues?.targetUrl ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="htmlCode" className="mb-1 block text-sm font-medium text-foreground">
          Или HTML код на рекламата{" "}
          <span className="font-normal text-muted-foreground">
            (напр. код от Google Ad Manager, вместо изображение)
          </span>
        </label>
        <textarea
          id="htmlCode"
          name="htmlCode"
          rows={4}
          defaultValue={defaultValues?.htmlCode ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-foreground">
            Начална дата
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.startDate)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-foreground">
            Крайна дата
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.endDate)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4 rounded border-border"
        />
        Активна
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Запази
      </button>
    </form>
  );
}
