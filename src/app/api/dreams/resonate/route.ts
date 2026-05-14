import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { rateLimit, POST_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit: 30 resonates per minute per IP
    const rl = rateLimit(request, { windowMs: 60_000, maxRequests: 30 });
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, message: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
      );
    }

    const json = await request.json();
    const dreamId = json?.dreamId;

    if (!dreamId || typeof dreamId !== "string") {
      return NextResponse.json(
        { ok: false, message: "Missing dreamId." },
        { status: 400 },
      );
    }

    if (!hasSupabaseEnv()) {
      // Preview mode: pretend it worked
      return NextResponse.json({ ok: true, resonated: true });
    }

    const supabase = getSupabaseAdmin();
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // Try to insert — if already resonated, ON CONFLICT will do nothing
    const { data: inserted, error: insertError } = await supabase
      .from("dream_resonates")
      .insert({ dream_id: dreamId, ip_hash: ipHash })
      .select("id")
      .maybeSingle();

    if (insertError) {
      // Check if it's a unique constraint violation (already resonated)
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: true, resonated: false, message: "Already resonated." });
      }
      console.error("[POST /api/dreams/resonate]", insertError);
      return NextResponse.json({ ok: false, message: "Failed." }, { status: 500 });
    }

    if (inserted) {
      // Increment the counter
      await supabase.rpc("increment_resonate_count", { dream_uuid: dreamId });
      return NextResponse.json({ ok: true, resonated: true });
    }

    return NextResponse.json({ ok: true, resonated: false, message: "Already resonated." });
  } catch (err) {
    console.error("[POST /api/dreams/resonate]", err);
    return NextResponse.json({ ok: false, message: "Unexpected error." }, { status: 500 });
  }
}
