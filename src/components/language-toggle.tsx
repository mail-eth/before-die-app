import Link from "next/link";
import { Locale } from "@/lib/content";
import { cn } from "@/lib/utils";

export function LanguageToggle({ locale }: { locale: Locale }) {
  return (
    <div className="inline-flex rounded-full border border-border/50 bg-card/50 p-1 text-xs font-medium">
      {(["id", "en"] as const).map((item) => (
        <Link
          key={item}
          href={`/${item}`}
          className={cn(
            "rounded-full px-3 py-1.5 transition-all hover:scale-105",
            locale === item
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
