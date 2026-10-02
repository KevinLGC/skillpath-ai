import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Email + password sign-in when Supabase Auth is configured. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: "Supabase is not configured on this deployment. Use a demo account instead." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Auth client unavailable" }, { status: 503 });

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }

  // Server-side redirect keeps the session cookie on the response.
  return Response.redirect(new URL("/dashboard", request.url), 303);
}
