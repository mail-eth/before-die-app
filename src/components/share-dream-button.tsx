"use client";

import { useState } from "react";

type Props = {
  dream: string;
  name: string;
  reason: string;
  locale: "id" | "en";
};

export function ShareDreamButton({ dream, name, reason, locale }: Props) {
  const [copied, setCopied] = useState(false);

  const cardUrl = `/api/dreams/card?dream=${encodeURIComponent(dream)}&name=${encodeURIComponent(name)}&reason=${encodeURIComponent(reason)}`;
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://before-die-app.vercel.app";
  const fullCardUrl = `${siteUrl}${cardUrl}`;

  const shareText = locale === "id"
    ? `"${dream}" — Before Die`
    : `"${dream}" — Before Die`;

  async function handleShare() {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Before Die",
          text: shareText,
          url: siteUrl,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to copy
      }
    }

    // Fallback: copy card URL
    try {
      await navigator.clipboard.writeText(fullCardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open in new tab
      window.open(fullCardUrl, "_blank");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-card border border-border/60 text-muted-foreground hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
      title={locale === "id" ? "Bagikan dream ini" : "Share this dream"}
    >
      {copied ? "✓" : "↗"}
      <span>{copied ? (locale === "id" ? "Tersalin!" : "Copied!") : (locale === "id" ? "Share" : "Share")}</span>
    </button>
  );
}
