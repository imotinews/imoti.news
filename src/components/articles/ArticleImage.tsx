import Image from "next/image";

// Shared fallback for articles without a featured image yet (all of them,
// until an image is uploaded/generated/extracted via the admin panel).
// Keeps the same aspect ratio as a real photo so grids stay aligned.

export default function ArticleImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  className = "",
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover ${className}`}
      />
    );
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
