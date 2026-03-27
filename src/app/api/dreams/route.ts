import { NextResponse } from "next/server";
import { sampleDreams } from "@/lib/content";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { dreamSchema, moderateSubmission } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = dreamSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, status: "rejected", message: "Please review your submission and try again." },
        { status: 400 },
      );
    }

    const moderated = moderateSubmission(parsed.data);

    if (moderated.status !== "published") {
      return NextResponse.json({ ok: false, status: moderated.status, message: moderated.message }, { status: 400 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ ok: true, status: "published", message: "Preview mode: your submission flow is ready, waiting for database connection." });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dreams").insert({
      name: moderated.value.name,
      dream: moderated.value.dream,
      reason: moderated.value.reason,
      language: moderated.value.language,
      status: "published",
      ip_hash: "pending",
    });

    if (error) {
      return NextResponse.json({ ok: false, status: "rejected", message: "Failed to save your submission." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "published", message: "Your dream has been received." });
  } catch {
    return NextResponse.json({ ok: false, status: "rejected", message: "Unexpected error." }, { status: 500 });
  }
}

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ items: sampleDreams, nextCursor: null, preview: true });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dreams")
    .select("id,name,dream,reason,language,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ items: sampleDreams, nextCursor: null, preview: true }, { status: 200 });
  }

  return NextResponse.json({
    items: data.map((item) => ({
      id: item.id,
      name: item.name,
      dream: item.dream,
      reason: item.reason,
      language: item.language,
      createdAt: item.created_at,
    })),
    nextCursor: null,
    preview: false,
  });
}
