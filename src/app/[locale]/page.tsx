import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe2 } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { MusicPlayer } from "@/components/music-player";
import { SubmitForm } from "@/components/submit-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { StoryCard } from "@/components/story-card";
import { DreamWall } from "@/components/dream-wall";
import { dictionaries, isLocale, type Dream, type Story } from "@/lib/content";

export const dynamic = "force-dynamic";

async function getDreams(locale: "id" | "en"): Promise<{ items: Dream[]; nextCursor: string | null; total: number }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://before-die-app.vercel.app";
    const res = await fetch(`${baseUrl}/api/dreams?limit=24&language=${locale}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return { items: [], nextCursor: null, total: 0 };
    const data = await res.json();
    return {
      items: data.items ?? [],
      nextCursor: data.nextCursor ?? null,
      total: data.total ?? data.items?.length ?? 0,
    };
  } catch {
    return { items: [], nextCursor: null, total: 0 };
  }
}

async function getFeaturedStory(): Promise<Story | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://before-die-app.vercel.app";
    const res = await fetch(`${baseUrl}/api/stories?featured=true&limit=1`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.stories?.length) return null;
    return data.stories[0];
  } catch {
    return null;
  }
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = dictionaries[locale];
  const [dreamsData, featuredStory] = await Promise.all([
    getDreams(locale),
    getFeaturedStory(),
  ]);

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
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border/50 bg-background/70 px-4 py-3 backdrop-blur-md sm:gap-4 md:px-10 lg:px-14">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href={`/${locale}`}
            className="font-serif text-lg font-semibold tracking-wide text-foreground/90 transition hover:text-foreground md:text-xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {copy.brand}
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <Link
              href={`/${locale}`}
              className={`rounded-full px-3 py-1.5 transition-all ${
                true ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {copy.navWall}
            </Link>
            <Link
              href={`/${locale}/stories`}
              className={`rounded-full px-3 py-1.5 transition-all ${
                false ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {copy.storiesNavLink}
            </Link>
            <Link
              href={`/${locale}/agents`}
              className="rounded-full px-3 py-1.5 transition-all text-muted-foreground hover:text-foreground"
            >
              For Agents
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <MobileNav locale={locale} />
          <LanguageToggle locale={locale} />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center md:px-10 lg:px-14">
        {/* Eyebrow */}
        <p className="hero-eyebrow mb-6 text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
          {copy.heroEyebrow}
        </p>

        {/* Main headline */}
        <h1
          className="hero-heading max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-8xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {copy.heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {copy.heroSubtitle}
        </p>

        {/* CTA */}
        <div className="hero-buttons mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#share"
            className="inline-flex items-center rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15"
          >
            {copy.heroPrimary}
          </a>
          <a
            href="#wall"
            className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-7 py-3.5 text-sm font-medium text-foreground/80 backdrop-blur transition hover:bg-card/90"
          >
            {copy.heroSecondary}
          </a>
        </div>

        {/* Decorative divider */}
        <div className="hero-divider mt-20 flex items-center gap-3 opacity-30">
          <div className="h-px w-12 bg-border" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-foreground/50" />
          <div className="h-px w-12 bg-border" />
        </div>
      </section>

      {/* ── Featured Story ── */}
      {featuredStory && (
        <section className="relative px-6 pb-16 md:px-10 lg:px-14">
          <div className="mx-auto max-w-3xl">
            <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-accent/70">
              {locale === "id" ? "Cerita Pilihan" : "Featured Story"}
            </p>
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 md:p-8">
              <StoryCard story={featuredStory} locale={locale} dict={moodDict} />
            </div>
          </div>
        </section>
      )}

      <DreamWall
        initialItems={dreamsData.items}
        initialNextCursor={dreamsData.nextCursor}
        total={dreamsData.total}
        locale={locale}
        copy={copy}
      />

      {/* ── Submit Section ── */}
      <section
        id="share"
        className="relative px-6 pb-28 md:px-10 lg:px-14"
      >
        <div className="mx-auto max-w-5xl">
          {/* Section header */}
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
              {copy.navShare}
            </p>
            <h2
              className="text-4xl font-bold tracking-tight md:text-5xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {copy.shareTitle}
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-sm leading-relaxed text-muted-foreground">
              {copy.shareSubtitle}
            </p>
          </div>

          {/* Form */}
          <div className="mx-auto max-w-xl">
            <SubmitForm locale={locale} copy={copy} />
          </div>
        </div>


      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 px-6 py-12 text-center md:px-10 lg:px-14">
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
    </main>
  );
}
