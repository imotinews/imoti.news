export type SourceFormValues = {
  name: string;
  url: string;
  type: "rss" | "scrape";
  active: boolean;
};

export default function SourceForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<SourceFormValues>;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
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
        <label htmlFor="url" className="mb-1 block text-sm font-medium text-foreground">
          URL адрес (RSS фийд или страница със списък от новини) *
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={defaultValues?.url}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="type" className="mb-1 block text-sm font-medium text-foreground">
          Тип
        </label>
        <select
          id="type"
          name="type"
          defaultValue={defaultValues?.type ?? "rss"}
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="rss">RSS фийд</option>
          <option value="scrape">Страница със списък (scrape)</option>
        </select>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4 rounded border-border"
        />
        Активен
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
