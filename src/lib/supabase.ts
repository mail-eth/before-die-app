import { createClient } from "@supabase/supabase-js";

/**
 * Checks the minimum server-side env vars needed for API mode.
 * We intentionally require the service role key because inserts/reads
 * in route handlers use admin access (not the browser anon client).
 */
export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Server-only Supabase admin client.
 * Do not import this helper inside client components.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env is not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}