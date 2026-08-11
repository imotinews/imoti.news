export type ArticleFormValues = {
  title: string;
  content: string;
  categoryId: string | null;
  sourceName: string;
  originalUrl: string;
  status: "draft" | "published";
};

export default function ArticleForm({
  action,
  defaultValues,
  categoryOptions,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<ArticleFormValues>;
  categoryOptions: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-foreground">
          Заглавие *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaultValues?.title}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-foreground">
          Категория
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={defaultValues?.categoryId ?? ""}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">— без категория —</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-foreground">
          Съдържание * <span className="font-normal text-muted-foreground">(всеки абзац на нов ред)</span>
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={10}
          defaultValue={defaultValues?.content}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sourceName" className="mb-1 block text-sm font-medium text-foreground">
            Име на източника *
          </label>
          <input
            id="sourceName"
            name="sourceName"
            type="text"
            required
            defaultValue={defaultValues?.sourceName}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="originalUrl" className="mb-1 block text-sm font-medium text-foreground">
            Линк към оригинала *
          </label>
          <input
            id="originalUrl"
            name="originalUrl"
            type="url"
            required
            defaultValue={defaultValues?.originalUrl}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-foreground">
          Статус
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "draft"}
          className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="draft">Чернова</option>
          <option value="published">Публикувана</option>
        </select>
      </div>

      <button
        type="submit"
        className="mt-2 w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Запази
      </button>
    </form>
  );
}
