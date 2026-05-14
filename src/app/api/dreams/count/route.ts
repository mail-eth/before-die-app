import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { sampleDreams } from "@/lib/content";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ count: sampleDreams.length, preview: true });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from("dreams")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    if (error) {
      return NextResponse.json({ count: 0, preview: false });
    }

    return NextResponse.json({ count: count ?? 0, preview: false });
  } catch {
    return NextResponse.json({ count: 0, preview: false });
  }
}
