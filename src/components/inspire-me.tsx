"use client";

import { useState, useCallback } from "react";

type Dream = {
  id: string;
  name: string;
  dream: string;
  reason: string;
  language: string;
};

type Props = {
  locale: "id" | "en";
};

export function InspireMe({ locale }: Props) {
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dreams/random");
      const data = await res.json();
      if (data.dream) {
        setDream(data.dream);
        setVisible(true);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(() => setDream(null), 300);
  };

  const buttonLabel = locale === "id" ? "Inspirasi Acak" : "Inspire Me";

  return (
    <>
      <button
        type="button"
        onClick={fetchRandom}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-5 py-2.5 text-sm font-medium text-accent transition-all hover:bg-accent/10 hover:border-accent/50 hover:scale-105 disabled:opacity-50"
      >
        <span className={loading ? "animate-spin" : ""}>🎲</span>
        {buttonLabel}
      </button>

      {/* Modal overlay */}
      {dream && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-300 ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Card */}
          <div
            className={`relative max-w-lg w-full rounded-3xl border border-border/60 bg-background p-10 shadow-2xl transition-all duration-300 ${
              visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute top-4 right-4 text-muted-foreground/50 hover:text-foreground text-xl"
            >
              &times;
            </button>

            {/* Label */}
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent/70">
              {locale === "id" ? "Inspirasi Acak" : "Random Dream"}
            </p>

            {/* Dream */}
            <h3
              className="text-2xl font-bold leading-snug tracking-tight text-foreground md:text-3xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              &ldquo;{dream.dream}&rdquo;
            </h3>

            {/* Reason */}
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {dream.reason}
            </p>

            {/* Author */}
            <div className="mt-6 flex items-center justify-between">
              <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                {dream.name}
              </span>
              <button
                onClick={fetchRandom}
                disabled={loading}
                className="text-xs text-muted-foreground/60 hover:text-foreground transition"
              >
                {loading ? "..." : locale === "id" ? "Acak lagi →" : "Another →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
