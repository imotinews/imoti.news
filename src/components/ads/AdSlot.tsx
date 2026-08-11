const POSITION_CONFIG = {
  header: { label: "Реклама · Header banner", className: "h-[90px] w-full" },
  footer: { label: "Реклама · Footer banner", className: "h-[90px] w-full" },
  sidebar: { label: "Реклама · Sidebar", className: "h-[250px] w-full max-w-[300px]" },
  in_article: { label: "Реклама · In-article", className: "h-[250px] w-full" },
} as const;

export type AdPosition = keyof typeof POSITION_CONFIG;

export type AdSlotAd = {
  id: string;
  imageUrl: string | null;
  htmlCode: string | null;
  targetUrl: string | null;
  name: string;
};

export default function AdSlot({ position, ad }: { position: AdPosition; ad?: AdSlotAd | null }) {
  const { label, className } = POSITION_CONFIG[position];

  if (ad?.htmlCode) {
    return (
      <div
        className={`mx-auto overflow-hidden ${className}`}
        dangerouslySetInnerHTML={{ __html: ad.htmlCode }}
      />
    );
  }

  if (ad?.imageUrl) {
    const image = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ad.imageUrl} alt={ad.name} className="h-full w-full object-cover" />
    );
    return (
      <div className={`mx-auto overflow-hidden rounded-md ${className}`}>
        {ad.targetUrl ? (
          <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer nofollow">
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground transition-colors hover:border-primary/50 ${className}`}
    >
      {label}
    </div>
  );
}
