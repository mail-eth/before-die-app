import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { sampleDreams } from "@/lib/content";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { dreamSchema, moderateSubmission } from "@/lib/validation";
import { rateLimit, POST_RATE_LIMIT, GET_RATE_LIMIT } from "@/lib/rate-limit";

type Locale = "id" | "en";

const messages = {
  id: {
    invalidInput: "Tolong cek ulang isian kamu lalu coba lagi.",
    rejected: "Submission belum bisa dipublish sekarang.",
    botDetected: "Bot terdeteksi.",
    preview: "Mode preview: alur submit sudah siap, menunggu koneksi database.",
    saveFailed: "Gagal menyimpan submission kamu.",
    unexpected: "Terjadi error tak terduga.",
    success: "Mimpimu sudah masuk.",
  },
  en: {
    invalidInput: "Please review your submission and try again.",
    rejected: "Your submission could not be published right now.",
    botDetected: "Bot detected.",
    preview: "Preview mode: your submission flow is ready, waiting for database connection.",
    saveFailed: "Failed to save your submission.",
    unexpected: "Unexpected error.",
    success: "Your dream has been received.",
  },
} as const;

function detectLanguage(input: unknown, request: Request): Locale {
  if (typeof input === "object" && input !== null && "language" in input) {
    const value = String((input as Record<string, unknown>).language ?? "").toLowerCase();
    if (value === "id" || value === "en") {
      return value;
    }
  }

  const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() ?? "";
  return acceptLanguage.includes("id") ? "id" : "en";
}

function getMessages(locale: Locale) {
  return messages[locale];
}

export async function POST(request: Request) {
  let locale: Locale = detectLanguage(null, request);

  try {
    // Rate limit check
    const limit = rateLimit(request, POST_RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false, status: "rejected", message: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } },
      );
    }

    const json = await request.json();
    locale = detectLanguage(json, request);
    const copy = getMessages(locale);

    const parsed = dreamSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, status: "rejected", message: copy.invalidInput },
        { status: 400 },
      );
    }

    const moderated = moderateSubmission(parsed.data);

    if (moderated.status !== "published") {
      const message = moderated.message === "Bot detected." ? copy.botDetected : copy.rejected;
      return NextResponse.json({ ok: false, status: moderated.status, message }, { status: 400 });
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({ ok: true, status: "published", message: copy.preview });
    }

    const supabase = getSupabaseAdmin();
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

    const { error } = await supabase.from("dreams").insert({
      name: moderated.value.name,
      dream: moderated.value.dream,
      reason: moderated.value.reason,
      language: moderated.value.language,
      status: "published",
      ip_hash: ipHash,
    });

    if (error) {
      return NextResponse.json({ ok: false, status: "rejected", message: copy.saveFailed }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "published", message: copy.success });
  } catch {
    const copy = getMessages(locale);
    return NextResponse.json({ ok: false, status: "rejected", message: copy.unexpected }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Rate limit check
  const limit = rateLimit(request, GET_RATE_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { items: [], nextCursor: null, message: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ items: sampleDreams, nextCursor: null, preview: true });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dreams")
    .select("id,name,dream,reason,language,created_at,resonates")
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
      resonates: item.resonates ?? 0,
    })),
    nextCursor: null,
    preview: false,
  });
}
