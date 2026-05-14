"use client";

import { useState } from "react";

type Props = {
  dreamId: string;
  initialCount: number;
};

export function ResonateButton({ dreamId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const [resonated, setResonated] = useState(false);
  const [animating, setAnimating] = useState(false);

  async function handleResonate() {
    if (resonated) return;

    setAnimating(true);
    setResonated(true);
    setCount((c) => c + 1);

    setTimeout(() => setAnimating(false), 600);

    try {
      const res = await fetch("/api/dreams/resonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamId }),
      });
      const data = await res.json();
      if (!data.ok || !data.resonated) {
        // Already resonated or error — keep UI state but don't increment further
      }
    } catch {
      // Optimistic UI — don't revert
    }
  }

  return (
    <button
      type="button"
      onClick={handleResonate}
      disabled={resonated}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        resonated
          ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
          : "bg-card border border-border/60 text-muted-foreground hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
      } ${animating ? "scale-110" : "scale-100"}`}
      title="This resonates with me"
    >
      <span className={`transition-transform ${animating ? "scale-125" : ""}`}>
        {resonated ? "🫀" : "🤍"}
      </span>
      <span>{count}</span>
    </button>
  );
}
