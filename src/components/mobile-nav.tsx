"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Locale } from "@/lib/content";
import { cn } from "@/lib/utils";

export function MobileNav({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-card/50 text-foreground/70 transition-all hover:bg-card/80 hover:text-foreground"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-md">
            <nav className="flex flex-col gap-1">
              <Link
                href={`/${locale}`}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-foreground/5 hover:text-foreground"
              >
                Wall
              </Link>
              <Link
                href={`/${locale}/stories`}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-foreground/5 hover:text-foreground"
              >
                Stories
              </Link>
              <Link
                href={`/${locale}/agents`}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-foreground/5 hover:text-foreground"
              >
                For Agents
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
