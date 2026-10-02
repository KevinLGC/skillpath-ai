/**
 * Supabase configuration. The app is fully functional without it (local demo
 * driver), and switches to Postgres + RLS automatically when the keys exist —
 * no code change required.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
/** Server-only. Accepts the new secret key name or the legacy service-role key. */
export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith("http") && SUPABASE_PUBLISHABLE_KEY.length > 0;
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && SUPABASE_SECRET_KEY.length > 0;
}

export function supabaseMode(): "supabase" | "local-demo" {
  return isSupabaseConfigured() ? "supabase" : "local-demo";
}
