import Link from "next/link";
import { CareerCard } from "@/components/career/career-card";
import { FactorRadar } from "@/components/charts/factor-radar";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionTitle } from "@/components/ui/primitives";
import { EmptyState, FactorBars, QualityBadge } from "@/components/ui/misc";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { getCareer } from "@/lib/data";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";

export default async function ResultsPage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const user = await getSessionUser();
  const context = await getStudentContext();

  if (!context.profile || context.recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("results.title")}</h1>
        <EmptyState
          title={locale === "te" ? "ఇంకా ఫలితాలు లేవు" : "No matches yet"}
          body={
            locale === "te"
              ? "అసెస్‌మెంట్ పూర్తి చేసిన తర్వాత ఇక్కడ వివరణలతో కూడిన సూచనలు కనిపిస్తాయి."
              : "Complete the assessment and your ranked matches will appear here — each one with the factors behind its score."
          }
          action={
            <Link href="/assessment" className="mt-2 inline-block">
              <Button>{t("home.hero.cta")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const top = context.recommendations[0]!;
  const topCareer = getCareer(top.careerSlug);
  const ineligible = await Promise.resolve(context.recommendations.filter((rec) => !rec.eligible));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("results.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">{t("results.subtitle")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{top.engineVersion}</Badge>
          <Badge variant="outline">{top.weightsVersion}</Badge>
          {context.isDemoFallback ? (
            <Badge variant="accent">
              {locale === "te" ? "డెమో విద్యార్థి ప్రొఫైల్" : "Showing the seeded demo student"}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* The trace: score, factors, explanation — the literal "explainable AI" artifact. */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "te" ? "అగ్ర సూచన ఎందుకు" : "Why the top match is the top match"}
          </CardTitle>
          <CardDescription>
            {topCareer ? (locale === "te" ? topCareer.title_te : topCareer.title_en) : top.careerSlug} ·{" "}
            {t("results.basedOnFactors", {
              available: top.contributions.filter((item) => item.available).length,
              total: top.contributions.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <FactorRadar contributions={top.contributions} locale={locale} />
          <FactorBars contributions={top.contributions} locale={locale} />
        </CardContent>
      </Card>

      <div>
        <SectionTitle hint={t("results.engineNote")}>{locale === "te" ? "సూచనలు" : "Ranked matches"}</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {context.recommendations.slice(0, 9).map((rec, index) => (
            <CareerCard key={rec.careerSlug} recommendation={rec} locale={locale} rank={index + 1} />
          ))}
        </div>
      </div>

      {topCareer ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("common.skillsToImprove")}</CardTitle>
            <CardDescription>
              {locale === "te"
                ? "మీ స్వీయ-రేటింగ్‌ల ఆధారంగా ఈ మార్గానికి అవసరమైన నైపుణ్యాలు"
                : "Based on your self-ratings against what this pathway expects"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {top.skillGap.slice(0, 6).map((row) => (
              <div key={row.skill} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{row.name_en}</span>
                <span className="text-[var(--muted-foreground)]">
                  {row.known ? `${row.have}/100 → ${row.required}/100` : locale === "te" ? "రేటింగ్ లేదు" : "not rated yet"}
                  {row.priority ? <Badge variant="warning" className="ml-2">priority</Badge> : null}
                </span>
              </div>
            ))}
            <Link href={`/skill-gap?career=${top.careerSlug}`} className="inline-block pt-2">
              <Button variant="outline" size="sm">
                {locale === "te" ? "పూర్తి నైపుణ్య లోటు" : "Full skill gap & learning plan"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {ineligible.length > 0 ? (
        <Alert variant="warning" title={locale === "te" ? "ఫిల్టర్ చేయబడినవి" : "Filtered out — and why"}>
          <ul className="space-y-1">
            {ineligible.map((rec) => (
              <li key={rec.careerSlug}>
                <span className="font-medium">{getCareer(rec.careerSlug)?.title_en ?? rec.careerSlug}</span>:{" "}
                {rec.ineligibleReasons.join(" · ")}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{locale === "te" ? "డేటా లేబుళ్లు" : "What the labels mean"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)]">
          <span className="flex items-center gap-2">
            <QualityBadge quality="illustrative" locale={locale} /> {locale === "te" ? "ఉదాహరణ సంఖ్యలు" : "seeded demo figures"}
          </span>
          <span className="flex items-center gap-2">
            <QualityBadge quality="sourced" locale={locale} /> {locale === "te" ? "అధికారిక మూలం" : "official source"}
          </span>
          <span className="flex items-center gap-2">
            <QualityBadge quality="guidance" locale={locale} /> {locale === "te" ? "సాధారణ సలహా" : "general guidance"}
          </span>
          {user ? <span className="ml-auto text-xs">{user.name}</span> : null}
        </CardContent>
      </Card>
    </div>
  );
}
