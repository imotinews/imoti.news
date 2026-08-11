const POSITION_CONFIG = {
  header: { label: "Реклама · Header banner", className: "h-[90px] w-full" },
  footer: { label: "Реклама · Footer banner", className: "h-[90px] w-full" },
  sidebar: { label: "Реклама · Sidebar", className: "h-[250px] w-full max-w-[300px]" },
  in_article: { label: "Реклама · In-article", className: "h-[250px] w-full" },
} as const;

export type AdPosition = keyof typeof POSITION_CONFIG;

export default function AdSlot({ position }: { position: AdPosition }) {
  const { label, className } = POSITION_CONFIG[position];

  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground transition-colors hover:border-primary/50 ${className}`}
    >
      {label}
    </div>
  );
}
