import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string };
  if (!isLocale(body.locale)) {
    return Response.json({ error: "Unsupported locale" }, { status: 400 });
  }
  const store = await cookies();
  store.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return Response.json({ locale: body.locale });
}
