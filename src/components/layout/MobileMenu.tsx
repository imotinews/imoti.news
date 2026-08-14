"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/categories";

export default function MobileMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Меню"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-5 w-5"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-md border border-border bg-background p-4 shadow-lg">
          <nav className="flex flex-col gap-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/kategoriya/${category.slug}`}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-foreground/80 hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
            <div className="my-1 border-t border-border" />
            <Link href="/tarsene" onClick={() => setOpen(false)} className="text-sm text-foreground/80 hover:text-primary">
              Търсене
            </Link>
            <Link href="/za-nas" onClick={() => setOpen(false)} className="text-sm text-foreground/80 hover:text-primary">
              За нас
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
