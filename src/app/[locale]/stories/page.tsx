import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe2 } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { MusicPlayer } from "@/components/music-player";
import { ThemeToggle } from "@/components/theme-toggle";
import { StoryCard } from "@/components/story-card";
import { StorySubmitForm } from "@/components/story-submit-form";
import { BottomNav } from "@/components/bottom-nav";
import { dictionaries, isLocale, type Story } from "@/lib/content";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStories(featured = false): Promise<Story[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://before-die-app.vercel.app";
    const url = featured
      ? `${baseUrl}/api/stories?featured=true&limit=1`
      : `${baseUrl}/api/stories?limit=50`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.stories ?? [];
  } catch {
    return [];
  }
}

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = dictionaries[locale];
  const [featuredStories, allStories] = await Promise.all([
    getStories(true),
    getStories(false),
  ]);

  const featured = featuredStories[0] ?? null;
  const stories = allStories.filter((s) => s.id !== featured?.id);

  const moodDict = {
    moodReflective: copy.moodReflective,
    moodHopeful: copy.moodHopeful,
    moodSomber: copy.moodSomber,
    moodFierce: copy.moodFierce,
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col">
      <MusicPlayer />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-border/50 bg-background/70 px-4 py-4 backdrop-blur-md md:gap-4 md:px-10 lg:px-14">
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href={`/${locale}`}
            className="font-serif text-lg font-semibold tracking-wide text-foreground/90 transition hover:text-foreground whitespace-nowrap md:text-xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {copy.brand}
          </Link>
          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-5 w-px bg-border flex-shrink-0" />
            <Link
              href={`/${locale}`}
              className="font-serif text-lg font-semibold tracking-wide text-muted-foreground/50 transition hover:text-foreground/70 whitespace-nowrap"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Wall
            </Link>
            <div className="h-5 w-px bg-border flex-shrink-0" />
            <span
              className="font-serif text-lg font-semibold tracking-wide text-foreground/70 whitespace-nowrap"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {copy.storiesNavLink}
            </span>
            <div className="h-5 w-px bg-border flex-shrink-0" />
            <Link
              href={`/${locale}/agents`}
              className="font-serif text-lg font-semibold tracking-wide text-muted-foreground/50 transition hover:text-foreground/70 whitespace-nowrap"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              For Agents
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <LanguageToggle locale={locale} />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Back to Wall ── */}
      <div className="px-4 pt-6 md:px-10 lg:px-14">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 transition hover:text-foreground/80"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          {locale === "id" ? "Kembali ke Dream Wall" : "Back to Dream Wall"}
        </Link>
      </div>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-12 pb-20 text-center md:px-10 lg:px-14">
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
          {copy.storiesEyebrow}
        </p>
        <h1
          className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-8xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {copy.storiesTitle}
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {copy.storiesSubtitle}
        </p>

        <div className="mt-20 flex items-center gap-3 opacity-30">
          <div className="h-px w-12 bg-border" />
          <div className="h-1 w-1 rounded-full bg-foreground/50" />
          <div className="h-px w-12 bg-border" />
        </div>
      </section>

      {/* ── Featured Story ── */}
      {featured && (
        <section className="relative px-4 pb-12 md:px-10 lg:px-14">
          <div className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent/70">
              {locale === "id" ? "Featured" : "Featured"}
            </p>
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 md:p-12">
              <StoryCard story={featured} locale={locale} dict={moodDict} />
            </div>
          </div>
        </section>
      )}

      {/* ── Stories Grid ── */}
      <section className="relative px-4 pb-24 md:px-10 lg:px-14">
        {stories.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                locale={locale}
                dict={moodDict}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/50 px-4 py-20 text-center">
            <h3 className="text-lg font-medium">{copy.storiesEmptyTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{copy.storiesEmptyBody}</p>
          </div>
        )}
      </section>

      {/* ── Submit Section ── */}
      <section
        id="share"
        className="relative px-4 pb-28 md:px-10 lg:px-14"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
              {copy.navShare}
            </p>
            <h2
              className="text-4xl font-bold tracking-tight md:text-5xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {copy.storiesSubmitLabel}
            </h2>
          </div>
          <div className="mx-auto max-w-xl">
            <StorySubmitForm locale={locale} copy={copy} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 px-4 py-12 pb-20 md:pb-12 text-center md:px-10 lg:px-14">
        <p
          className="mx-auto max-w-2xl text-sm leading-relaxed italic text-muted-foreground/70"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          &ldquo;{copy.footerLine}&rdquo;
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/40">
          <Globe2 className="h-3.5 w-3.5" />
          <span>ID / EN</span>
          <span className="mx-1">·</span>
          <span>Before Die</span>
        </div>
      </footer>

      {/* ── Bottom Navigation (Mobile Only) ── */}
      <BottomNav locale={locale} />
    </main>
  );
}
