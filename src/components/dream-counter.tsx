"use client";

import { useState, useEffect } from "react";

type Props = {
  initialCount: number;
  locale: "id" | "en";
};

export function DreamCounter({ initialCount, locale }: Props) {
  const [count, setCount] = useState(initialCount);
  const [displayed, setDisplayed] = useState(0);

  // Animate counter on mount
  useEffect(() => {
    if (count === 0) return;
    const duration = 1500;
    const steps = 30;
    const increment = count / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayed(count);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [count]);

  const label = locale === "id"
    ? `mimpi telah dibagikan`
    : `dreams shared so far`;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-5 py-2.5 backdrop-blur">
      <span className="text-lg font-bold text-accent tabular-nums">
        {displayed}
      </span>
      <span className="text-sm text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
