export default function NewsletterForm() {
  return (
    <form className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Имейл адрес
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Твоят имейл"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        Абонирай се
      </button>
    </form>
  );
}
