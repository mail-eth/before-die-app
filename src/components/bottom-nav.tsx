"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Bot, PenLine } from "lucide-react";

interface BottomNavProps {
  locale: string;
}

export function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: `/${locale}`,
      icon: Home,
      label: locale === "id" ? "Wall" : "Wall",
      active: pathname === `/${locale}`,
    },
    {
      href: `/${locale}/stories`,
      icon: BookOpen,
      label: locale === "id" ? "Cerita" : "Stories",
      active: pathname === `/${locale}/stories`,
    },
    {
      href: `/${locale}/agents`,
      icon: Bot,
      label: locale === "id" ? "Agents" : "Agents",
      active: pathname === `/${locale}/agents`,
    },
    {
      href: `/${locale}#share`,
      icon: PenLine,
      label: locale === "id" ? "Tulis" : "Share",
      active: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-all ${
                item.active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-all ${
                  item.active ? "scale-110" : ""
                }`}
                strokeWidth={item.active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  item.active ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
