import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { storySchema, moderateStory } from "@/lib/validation";
import type { Story, AuthorType, Mood } from "@/lib/content";

type Locale = "id" | "en";

const messages = {
  id: {
    notConfigured: "Backend database belum dikonfigurasi.",
    unexpected: "Terjadi error tak terduga.",
    success: "Story kamu sudah masuk dan sedang dalam moderasi.",
    rejected: "Story belum bisa dipublish sekarang.",
    botDetected: "Bot terdeteksi.",
    invalidInput: "Tolong cek ulang isian kamu lalu coba lagi.",
  },
  en: {
    notConfigured: "Backend database is not configured.",
    unexpected: "An unexpected error occurred.",
    success: "Your story has been received and is under review.",
    rejected: "Your story could not be published right now.",
    botDetected: "Bot detected.",
    invalidInput: "Please review your submission and try again.",
  },
} as const;

function getMessages(locale: Locale) {
  return messages[locale];
}

function detectLanguage(input: unknown): Locale {
  if (typeof input === "object" && input !== null && "language" in input) {
    const value = String((input as Record<string, unknown>).language ?? "").toLowerCase();
    if (value === "id" || value === "en") return value;
  }
  return "en";
}

function mapRow(row: Record<string, unknown>): Story {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    content: String(row.content ?? ""),
    authorName: String(row.author_name ?? ""),
    authorType: (row.author_type ?? "anonymous") as AuthorType,
    mood: (row.mood ?? "reflective") as Mood,
    language: (row.language ?? "en") as Locale,
    createdAt: String(row.created_at ?? ""),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const locale = (searchParams.get("locale") ?? "en") as Locale;

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { stories: [], message: getMessages(locale).notConfigured },
      { status: 200 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("stories")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (featured) {
      query = query.eq("featured", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/stories]", error);
      return NextResponse.json(
        { stories: [], message: getMessages(locale).unexpected },
        { status: 200 },
      );
    }

    const stories = (data ?? []).map(mapRow);
    return NextResponse.json({ stories }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/stories]", err);
    return NextResponse.json(
      { stories: [], message: getMessages(locale).unexpected },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  let locale: Locale = "en";

  try {
    const json = await request.json();
    locale = detectLanguage(json);
    const copy = getMessages(locale);

    const parsed = storySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, status: "rejected", message: copy.invalidInput },
        { status: 400 },
      );
    }

    const moderated = moderateStory(parsed.data);

    if (moderated.status === "rejected") {
      const message = moderated.message === "Bot detected." ? copy.botDetected : copy.rejected;
      return NextResponse.json({ ok: false, status: moderated.status, message }, { status: 400 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { ok: true, status: "pending", message: copy.notConfigured },
        { status: 200 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("stories").insert({
      title: moderated.value.title,
      content: moderated.value.content,
      author_name: moderated.value.authorName,
      author_type: moderated.value.authorType,
      mood: moderated.value.mood,
      language: moderated.value.language,
      published: true,
      featured: false,
    });

    if (error) {
      console.error("[POST /api/stories]", error);
      return NextResponse.json(
        { ok: false, status: "error", message: copy.rejected },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, status: "pending", message: copy.success },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/stories]", err);
    return NextResponse.json(
      { ok: false, status: "error", message: getMessages(locale).unexpected },
      { status: 500 },
    );
  }
}
