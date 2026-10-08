import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Email + password sign-in when Supabase Auth is configured.
 *
 * This is a plain HTML form post, so every failure has to land back on the form
 * as a readable message — returning JSON would navigate the browser to a raw
 * error body. Failures redirect to /login with a short code the page turns into
 * a sentence.
 */
export async function POST(request: Request) {
  const fail = (code: string) =>
    Response.redirect(new URL(`/login?error=${code}`, request.url), 303);

  if (!isSupabaseConfigured()) return fail("unconfigured");

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return fail("missing");

  const supabase = await getSupabaseServerClient();
  if (!supabase) return fail("unavailable");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail("invalid");

  // Server-side redirect keeps the session cookie on the response.
  return Response.redirect(new URL("/dashboard", request.url), 303);
}
