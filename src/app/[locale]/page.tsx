import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe2 } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { MusicPlayer } from "@/components/music-player";
import { SubmitForm } from "@/components/submit-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { StoryCard } from "@/components/story-card";
import { dictionaries, isLocale, type Dream, type Story } from "@/lib/content";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDreams(): Promise<Dream[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://before-die-app.vercel.app";
    const res = await fetch(`${baseUrl}/api/dreams`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items?.length) return [];
    return data.items;
  } catch {
    return [];
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
  const [dreams, featuredStory] = await Promise.all([
    getDreams(),
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
      <header className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-border/50 bg-background/70 px-4 py-4 backdrop-blur-md md:gap-4 md:px-10 lg:px-14">
        <div className="flex items-center gap-3 md:gap-6 overflow-x-auto">
          <Link
            href={`/${locale}`}
            className="font-serif text-lg font-semibold tracking-wide text-foreground/90 transition hover:text-foreground whitespace-nowrap md:text-xl"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {copy.brand}
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href={`/${locale}`}
              className={`rounded-full px-3 py-1.5 transition-all whitespace-nowrap md:px-4 ${
                true ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {copy.navWall}
            </Link>
            <Link
              href={`/${locale}/stories`}
              className={`rounded-full px-3 py-1.5 transition-all whitespace-nowrap md:px-4 ${
                false ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {copy.storiesNavLink}
            </Link>
            <Link
              href={`/${locale}/agents`}
              className={`rounded-full px-3 py-1.5 transition-all text-muted-foreground hover:text-foreground whitespace-nowrap md:px-4`}
            >
              For Agents
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <LanguageToggle locale={locale} />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center md:px-10 lg:px-14">
        {/* Eyebrow */}
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
          {copy.heroEyebrow}
        </p>

        {/* Main headline */}
        <h1
          className="max-w-4xl px-2 text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-8xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {copy.heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="mt-8 max-w-2xl px-2 text-base leading-relaxed text-muted-foreground md:text-lg">
          {copy.heroSubtitle}
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 px-2">
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
        <div className="mt-20 flex items-center gap-3 opacity-30">
          <div className="h-px w-12 bg-border" />
          <div className="h-1 w-1 rounded-full bg-foreground/50" />
          <div className="h-px w-12 bg-border" />
        </div>
      </section>

      {/* ── Featured Story ── */}
      {featuredStory && (
        <section className="relative px-4 pb-16 md:px-10 lg:px-14">
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

      {/* ── Dream Wall ── */}
      <section id="wall" className="relative px-4 pb-24 md:px-10 lg:px-14">
        {/* Section header */}
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
          </div>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            {copy.wallSubtitle}
          </p>
        </div>

        {/* Grid */}
        {dreams.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dreams.map((dream) => (
              <article
                key={dream.id}
                className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur transition hover:-translate-y-1 hover:border-border/90 hover:bg-card/90 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
              >
                {/* Top meta */}
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-accent">
                      {dream.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      {dream.language === "id" ? "ID" : "EN"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/50">
                    {relativeTime(dream.createdAt)}
                  </span>
                </div>

                {/* The dream */}
                <h3 className="mb-4 text-xl font-semibold leading-snug tracking-tight text-foreground">
                  &ldquo;{dream.dream}&rdquo;
                </h3>

                {/* Reason */}
                <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                  {dream.reason}
                </p>

                {/* Subtle accent line on hover */}
                <div className="absolute inset-x-7 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/50 px-4 py-20 text-center">
            <h3 className="text-lg font-medium">{copy.emptyTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p>
          </div>
        )}
      </section>

      {/* ── Submit Section ── */}
      <section
        id="share"
        className="relative px-4 pb-28 md:px-10 lg:px-14"
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
      <footer className="border-t border-border/40 px-4 py-12 text-center md:px-10 lg:px-14">
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
