import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { sampleDreams } from "@/lib/content";

export async function GET() {
  if (!hasSupabaseEnv()) {
    const random = sampleDreams[Math.floor(Math.random() * sampleDreams.length)];
    return NextResponse.json({ dream: random, preview: true });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Get total count
    const { count } = await supabase
      .from("dreams")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    if (!count || count === 0) {
      const random = sampleDreams[Math.floor(Math.random() * sampleDreams.length)];
      return NextResponse.json({ dream: random, preview: true });
    }

    // Get random offset
    const offset = Math.floor(Math.random() * count);
    const { data, error } = await supabase
      .from("dreams")
      .select("id,name,dream,reason,language,created_at,resonates")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(offset, offset)
      .limit(1)
      .single();

    if (error || !data) {
      const random = sampleDreams[Math.floor(Math.random() * sampleDreams.length)];
      return NextResponse.json({ dream: random, preview: true });
    }

    return NextResponse.json({
      dream: {
        id: data.id,
        name: data.name,
        dream: data.dream,
        reason: data.reason,
        language: data.language,
        createdAt: data.created_at,
        resonates: data.resonates ?? 0,
      },
      preview: false,
    });
  } catch {
    const random = sampleDreams[Math.floor(Math.random() * sampleDreams.length)];
    return NextResponse.json({ dream: random, preview: true });
  }
}
