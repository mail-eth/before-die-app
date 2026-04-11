import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import type { Story, AuthorType, Mood } from "@/lib/content";

type Locale = "id" | "en";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") ?? "en") as Locale;

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { story: null, message: "Backend database is not configured." },
      { status: 200 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/stories/[id]]", error);
      return NextResponse.json({ story: null }, { status: 200 });
    }

    if (!data) {
      return NextResponse.json({ story: null }, { status: 404 });
    }

    return NextResponse.json({ story: mapRow(data as Record<string, unknown>) }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/stories/[id]]", err);
    return NextResponse.json({ story: null }, { status: 500 });
  }
}
