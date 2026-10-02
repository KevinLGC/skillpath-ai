import Link from "next/link";
import { ArrowRight, Bot, Compass, Landmark, ListChecks, Share2, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { getSessionUser, currentLocale } from "@/lib/auth/session";
import { careers } from "@/lib/data";
import { createTranslator } from "@/lib/i18n/messages";

export default async function HomePage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const user = await getSessionUser();

  const features = [
    { icon: Compass, title: t("home.features.engine.title"), body: t("home.features.engine.body") },
    { icon: Share2, title: t("home.features.family.title"), body: t("home.features.family.body") },
    { icon: Bot, title: t("home.features.grounded.title"), body: t("home.features.grounded.body") },
    { icon: Landmark, title: t("home.features.local.title"), body: t("home.features.local.body") },
  ];

  const steps = [
    { title: t("home.how.step1.title"), body: t("home.how.step1.body"), icon: ListChecks },
    { title: t("home.how.step2.title"), body: t("home.how.step2.body"), icon: Compass },
    { title: t("home.how.step3.title"), body: t("home.how.step3.body"), icon: Share2 },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} signedIn={Boolean(user)} />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <Badge variant="accent" className="mb-4">
                {careers.length} vocational pathways · {locale === "te" ? "తెలుగు & ఇంగ్లీష్" : "English & Telugu"}
              </Badge>
              <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-5xl">{t("home.hero.title")}</h1>
              <p className="mt-4 max-w-2xl text-base text-[var(--muted-foreground)] lg:text-lg">{t("home.hero.subtitle")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={user ? "/assessment" : "/login"}>
                  <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-base font-medium text-[var(--primary-foreground)]">
                    {t("home.hero.cta")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
                <Link href="/careers">
                  <span className="inline-flex h-11 items-center rounded-lg border border-[var(--border)] px-6 text-base font-medium">
                    {t("home.hero.secondary")}
                  </span>
                </Link>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {t("common.disclaimer")}
              </p>
            </div>

            <Card className="bg-[var(--card)]">
              <CardHeader>
                <CardTitle>{locale === "te" ? "ఉదాహరణ: రాహుల్, 12వ తరగతి" : "Example: Rahul, Class 12"}</CardTitle>
                <CardDescription>
                  {locale === "te"
                    ? "విశాఖపట్నం · బడ్జెట్ పరిమితి · యంత్రాలు & సాంకేతికతపై ఆసక్తి"
                    : "Visakhapatnam · limited budget · interested in machines & technology"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Electric Vehicle Technician", score: 91 },
                  { name: "Automotive Service Technician", score: 87 },
                  { name: "CNC Machine Operator", score: 81 },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {locale === "te" ? "కారణాలతో సహా వివరణ" : "with the factors behind the score"}
                      </p>
                    </div>
                    <span className="text-lg font-semibold tabular-nums">{item.score}%</span>
                  </div>
                ))}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {locale === "te"
                    ? "ఈ శాతాలు ఇంజిన్ లెక్కించినవి — ఏఐ ఊహించినవి కావు."
                    : "These percentages come from the scoring engine, not from a language model's guess."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--secondary)] py-12">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t("home.how.title")}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <Card key={step.title}>
                  <CardHeader>
                    <step.icon className="h-5 w-5 text-[var(--primary)]" aria-hidden />
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted-foreground)]">{step.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">{t("home.features.title")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-5 w-5 text-[var(--primary)]" aria-hidden />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
