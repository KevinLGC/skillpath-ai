import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DemoSignIn } from "@/components/app/controls";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createTranslator } from "@/lib/i18n/messages";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const user = await getSessionUser();
  const supabaseReady = isSupabaseConfigured();
  const { error: errorCode } = await searchParams;

  const errorMessage =
    errorCode === "invalid"
      ? locale === "te"
        ? "ఇమెయిల్ లేదా పాస్‌వర్డ్ సరిపోలలేదు. మళ్లీ ప్రయత్నించండి."
        : "That email and password don't match an account. Check them and try again."
      : errorCode === "missing"
        ? locale === "te"
          ? "ఇమెయిల్ మరియు పాస్‌వర్డ్ రెండూ అవసరం."
          : "Enter both your email and password."
        : errorCode === "unconfigured" || errorCode === "unavailable"
          ? locale === "te"
            ? "ఈ డిప్లాయ్‌మెంట్‌లో ఖాతా సైన్-ఇన్ అందుబాటులో లేదు. డెమో ఖాతాను ఉపయోగించండి."
            : "Account sign-in isn't available on this deployment. Use a demo account below."
          : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight">{t("login.title")}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {locale === "te"
            ? "SIH ప్రదర్శన కోసం నాలుగు సిద్ధమైన ఖాతాలు ఉన్నాయి."
            : "Four seeded roles are available so the walkthrough works end to end."}
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("login.demoTitle")}</CardTitle>
            <CardDescription>{t("login.demoBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DemoSignIn />
          </CardContent>
        </Card>

        {supabaseReady ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{locale === "te" ? "ఖాతాతో సైన్ ఇన్" : "Sign in with an account"}</CardTitle>
              <CardDescription>
                {locale === "te"
                  ? "సుపాబేస్ ఆథ్ కాన్ఫిగర్ చేయబడింది. ఇమెయిల్ & పాస్‌వర్డ్ ఉపయోగించండి."
                  : "Supabase Auth is configured. Sign in with email and password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage ? (
                <Alert variant="danger" className="mb-3">
                  {errorMessage}
                </Alert>
              ) : null}
              <form className="space-y-3" action="/api/auth/login" method="post">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="email">
                    {t("login.email")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="password">
                    {t("login.password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 w-full rounded-lg bg-[var(--primary)] text-sm font-medium text-[var(--primary-foreground)]"
                >
                  {t("login.submit")}
                </button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Alert className="mt-6" variant="info" title={locale === "te" ? "సుపాబేస్ కాన్ఫిగర్ చేయలేదు" : "Supabase not configured"}>
            <p>{t("login.supabaseNotConfigured")}</p>
            <p className="mt-2 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden />
              <span>
                {locale === "te"
                  ? "నిజ ఖాతాలు, RLS మరియు డేటాబేస్ నిల్వ కోసం .env.localలో NEXT_PUBLIC_SUPABASE_URL మరియు కీలు జోడించండి. మైగ్రేషన్లు supabase/migrations లో ఉన్నాయి."
                  : "Add NEXT_PUBLIC_SUPABASE_URL and keys to .env.local for real accounts, RLS enforcement and persistent storage. Migrations live in supabase/migrations."}
              </span>
            </p>
          </Alert>
        )}

        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          {locale === "te" ? "ఇంకా తెలుసుకోవాలా? " : "Want the details first? "}
          <Link className="font-medium text-[var(--primary)] underline" href="/how-it-works">
            {locale === "te" ? "ఇది ఎలా పనిచేస్తుంది" : "See how the engine works"}
          </Link>
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
