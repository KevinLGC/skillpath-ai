import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/config";

/**
 * Cookie-based Supabase client for server components and route handlers.
 * Returns null when Supabase is not configured so callers can fall back to the
 * local demo driver instead of throwing during a demo.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component render: safe to ignore, the session
          // refresh happens in middleware instead.
        }
      },
    },
  });
}

/**
 * Admin client using the secret key. SERVER ONLY — this bypasses RLS, so it is
 * used only for knowledge-base ingestion, seeding and report writes, never for
 * user-facing reads of other people's data.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
