import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { sampleDreams, type Dream, type Story, type AuthorType, type Mood, type Locale } from "@/lib/content";

function mapStoryRow(row: Record<string, unknown>): Story {
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

export async function getDreams(limit = 12): Promise<(Dream & { resonates: number })[]> {
  if (!hasSupabaseEnv()) {
    return sampleDreams.map((d) => ({ ...d, resonates: Math.floor(Math.random() * 12) }));
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("dreams")
      .select("id,name,dream,reason,language,created_at,resonates")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data?.length) {
      return sampleDreams.map((d) => ({ ...d, resonates: 0 }));
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      dream: item.dream,
      reason: item.reason,
      language: item.language as Locale,
      createdAt: item.created_at,
      resonates: item.resonates ?? 0,
    }));
  } catch {
    return sampleDreams.map((d) => ({ ...d, resonates: 0 }));
  }
}

export async function getDreamCount(): Promise<number> {
  if (!hasSupabaseEnv()) {
    return sampleDreams.length;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from("dreams")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getStories(options?: { featured?: boolean; limit?: number }): Promise<Story[]> {
  const { featured = false, limit = 50 } = options ?? {};

  if (!hasSupabaseEnv()) {
    return [];
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

    if (error || !data?.length) {
      return [];
    }

    return data.map((row) => mapStoryRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getStoryById(id: string): Promise<Story | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapStoryRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
