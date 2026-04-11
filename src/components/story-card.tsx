"use client";

import { useState } from "react";
import type { Story, Locale } from "@/lib/content";
import { relativeTime } from "@/lib/utils";

type Props = {
  story: Story;
  locale: Locale;
  dict: {
    moodReflective: string;
    moodHopeful: string;
    moodSomber: string;
    moodFierce: string;
  };
};

const moodColors: Record<string, string> = {
  reflective: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  hopeful: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  somber: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300",
  fierce: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const moodLabels: Record<string, string> = {
  reflective: "Reflective",
  hopeful: "Hopeful",
  somber: "Somber",
  fierce: "Fierce",
};

export function StoryCard({ story, locale, dict }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isLong = story.content.length > 300;
  const preview = isLong && !expanded
    ? story.content.slice(0, 300) + "…"
    : story.content;

  const authorDisplay =
    story.authorType === "anonymous"
      ? "🔒 Anonymous"
      : story.authorType === "emoji"
      ? story.authorName
      : story.authorName;

  const moodColor = moodColors[story.mood] ?? moodColors.reflective;
  const moodLabelMap: Record<string, string> = {
    reflective: dict.moodReflective,
    hopeful: dict.moodHopeful,
    somber: dict.moodSomber,
    fierce: dict.moodFierce,
  };
  const moodLabel = moodLabelMap[story.mood] ?? moodLabels[story.mood] ?? story.mood;

  return (
    <article
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur transition hover:-translate-y-1 hover:border-border/90 hover:bg-card/90 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
    >
      {/* Top meta */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${moodColor}`}>
            {moodLabel}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {story.language === "id" ? "ID" : "EN"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/50">
          {relativeTime(story.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-4 text-xl font-semibold leading-snug tracking-tight text-foreground">
        {story.title}
      </h3>

      {/* Content */}
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {preview}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-accent/70 hover:text-accent transition-colors"
          >
            {expanded ? "Tutup" : "Baca lagi →"}
          </button>
        )}
      </div>

      {/* Author */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground/70">
          {authorDisplay}
        </span>
      </div>

      {/* Subtle accent line on hover */}
      <div className="absolute inset-x-7 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
    </article>
  );
}
