"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";

export default function BlobUploadInput({
  multiple = false,
  onUploaded,
  className,
}: {
  multiple?: boolean;
  onUploaded: (urls: string[]) => Promise<void>;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setPending(true);
    setError(null);
    try {
      // Uploads straight from the browser to Blob storage -- our server
      // never sees the file bytes, so there's no request-size ceiling to
      // hit no matter how many photos or how large they are.
      const urls: string[] = [];
      for (const file of files) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        urls.push(blob.url);
      }
      await onUploaded(urls);
      router.refresh();
    } catch {
      setError("Качването се провали. Опитай пак.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={pending}
        onChange={handleChange}
        className={className ?? "block text-sm text-foreground"}
      />
      {pending && <p className="mt-1 text-xs text-muted-foreground">Качва се...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
