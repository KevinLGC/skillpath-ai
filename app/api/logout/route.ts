import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut().catch(() => undefined);
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
