import { cookies } from "next/headers";
import { DEMO_ACCOUNTS, findDemoAccount } from "@/lib/auth/demo-accounts";
import { demoAccountToUser, SESSION_COOKIE, sessionCookieValue } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { accountId?: string };
  const account = findDemoAccount(body.accountId ?? "");
  if (!account) {
    return Response.json(
      { error: "Unknown demo account", available: DEMO_ACCOUNTS.map((a) => a.id) },
      { status: 400 },
    );
  }

  const user = demoAccountToUser(account.id);
  if (!user) return Response.json({ error: "Could not build session" }, { status: 500 });

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookieValue(user, account.studentId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
  });

  return Response.json({ user: { name: user.name, role: user.role } });
}
