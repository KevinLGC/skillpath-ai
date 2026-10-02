import { cookies } from "next/headers";
import { DEMO_ACCOUNTS, findDemoAccount } from "@/lib/auth/demo-accounts";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_STUDENT_ID } from "@/lib/demo/student";
import type { Locale, Role, SessionUser } from "@/lib/types";
import { normalizeLocale } from "@/lib/i18n/config";

export const SESSION_COOKIE = "sp_session";

interface SessionPayload {
  id: string;
  name: string;
  role: Role;
  email: string | null;
  studentId: string | null;
}

function encode(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decode(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Session resolution order:
 *   1. Supabase Auth (cookie session) when configured — real accounts, real RLS.
 *   2. Local demo session cookie — keeps the prototype explorable with no setup.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, locale, student_id")
        .eq("id", user.id)
        .maybeSingle();
      return {
        id: user.id,
        name: (profile?.full_name as string | undefined) ?? user.email ?? "User",
        role: ((profile?.role as Role | undefined) ?? "student") as Role,
        email: user.email ?? null,
        locale: normalizeLocale(profile?.locale as string | undefined),
        kind: "supabase",
      };
    }
  }

  const store = await cookies();
  const payload = decode(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  return {
    id: payload.id,
    name: payload.name,
    role: payload.role,
    email: payload.email,
    locale: normalizeLocale((await getLocaleFromCookie()) ?? null),
    kind: "demo",
  };
}

async function getLocaleFromCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get("sp_locale")?.value;
}

/** Which student's data this user should see. */
export async function getActiveStudentId(user: SessionUser | null): Promise<string | null> {
  if (!user) return null;
  if (user.kind === "demo") {
    const account = findDemoAccount(user.id);
    return account?.studentId ?? (user.role === "student" ? DEMO_STUDENT_ID : null);
  }
  const store = await cookies();
  return decode(store.get(SESSION_COOKIE)?.value)?.studentId ?? null;
}

export function demoAccountToUser(accountId: string): SessionUser | null {
  const account = findDemoAccount(accountId);
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    role: account.role,
    email: account.email,
    locale: "en",
    kind: "demo",
  };
}

export function sessionCookieValue(user: SessionUser, studentId: string | null): string {
  return encode({
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    studentId,
  });
}

export { DEMO_ACCOUNTS };

export async function requireRole(roles: Role[]): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return roles.includes(user.role) ? user : null;
}

export async function currentLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get("sp_locale")?.value);
}
