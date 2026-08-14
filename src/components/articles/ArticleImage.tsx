// Shared fallback for articles without a featured image yet (all of them,
// until the admin-triggered AI image generation from DESIGN.md ships).
// Keeps the same aspect ratio as a real photo so grids stay aligned.

export default function ArticleImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />;
  }

  return (
    <div className={`flex h-full w-full items-center justify-center bg-muted ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        className="h-8 w-8 text-muted-foreground/40"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9.5L12 4l7 5.5V21M9 21v-6h6v6" />
      </svg>
    </div>
  );
}
