"use client";

import { useState } from "react";
import type { Dream, Locale } from "@/lib/content";
import { relativeTime } from "@/lib/utils";

type Copy = {
  wallTitle: string;
  wallSubtitle: string;
  emptyTitle: string;
  emptyBody: string;
  loadMore: string;
};

type DreamsResponse = {
  items: Dream[];
  nextCursor: string | null;
  total: number;
};

export function DreamWall({
  initialItems,
  initialNextCursor,
  total,
  locale,
  copy,
}: {
  initialItems: Dream[];
  initialNextCursor: string | null;
  total: number;
  locale: Locale;
  copy: Copy;
}) {
  const [dreams, setDreams] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!nextCursor || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/dreams?offset=${nextCursor}&limit=24`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = (await res.json()) as DreamsResponse;
      setDreams((current) => [...current, ...data.items]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="wall" className="relative px-6 pb-24 md:px-10 lg:px-14">
      <div className="mb-14 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
            {locale === "id" ? "Kumpulan mimpi" : "A collection of"}
          </p>
          <h2
            className="text-4xl font-bold tracking-tight md:text-5xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {copy.wallTitle}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground/50">
            {total} {locale === "id" ? "mimpi" : "dreams"} {locale === "id" ? "tercatat" : "recorded"}
          </p>
        </div>
        <p className="max-w-md text-sm leading-7 text-muted-foreground">{copy.wallSubtitle}</p>
      </div>

      {dreams.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dreams.map((dream) => (
              <article
                key={dream.id}
                className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur transition hover:-translate-y-1 hover:border-border/90 hover:bg-card/90 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
              >
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-accent">
                      {dream.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      {dream.language === "id" ? "ID" : "EN"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/50">{relativeTime(dream.createdAt)}</span>
                </div>

                <h3 className="mb-4 text-xl font-semibold leading-snug tracking-tight text-foreground">
                  &ldquo;{dream.dream}&rdquo;
                </h3>

                <p className="mt-auto text-sm leading-relaxed text-muted-foreground">{dream.reason}</p>

                <div className="absolute inset-x-7 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            ))}
          </div>

          {nextCursor ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-6 py-3 text-sm font-medium text-foreground/80 backdrop-blur transition hover:bg-card/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (locale === "id" ? "Memuat..." : "Loading...") : copy.loadMore}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/50 px-6 py-20 text-center">
          <h3 className="text-lg font-medium">{copy.emptyTitle}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p>
        </div>
      )}
    </section>
  );
}
