import Link from "next/link";
import { AlertTriangle, GraduationCap, Route } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui/primitives";
import { QualityBadge, SourceList } from "@/components/ui/misc";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { getCareer } from "@/lib/data";
import { getStore, isShareLinkActive } from "@/lib/db";
import { buildRoadmap, roadmapTimeline } from "@/lib/roadmap";
import { estimatedTrainingCost, recommendationFor } from "@/lib/recommendation";
import { buildDecisionReport } from "@/lib/report";
import type { DecisionReport } from "@/lib/types";

/**
 * Public family view.
 *
 * This route is the only unauthenticated data surface in the app, and it is
 * deliberately narrow: the token must exist, must be unexpired and unrevoked,
 * and it only ever exposes the shared student's plan.
 */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await currentLocale();
  const user = await getSessionUser();
  const store = getStore();

  const link = await store.getShareLink(token);

  if (!link || !isShareLinkActive(link)) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader locale={locale} signedIn={Boolean(user)} />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
          <Alert variant="warning" title={locale === "te" ? "ఈ లింక్ చెల్లదు" : "This link is no longer active"}>
            <p>
              {locale === "te"
                ? "లింక్ గడువు ముగిసింది లేదా విద్యార్థి రద్దు చేశారు. కొత్త లింక్ కోసం విద్యార్థిని అడగండి."
                : "The link has expired or the student revoked it. Ask the student to create a new one — revocation takes effect immediately."}
            </p>
          </Alert>
          <Link className="mt-4 inline-block text-sm underline" href="/">
            {locale === "te" ? "హోమ్‌కు వెళ్లండి" : "Back to home"}
          </Link>
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  // Prefer a stored report snapshot so the family sees exactly what was shared.
  const stored = await store.getReportByToken(token);
  let report: DecisionReport | null = stored?.report ?? null;

  if (!report) {
    for (const slug of link.careerSlugs.length > 0 ? link.careerSlugs : [""]) {
      const career = slug ? getCareer(slug) : undefined;
      if (!career) continue;
      const assessments = await store.listAssessments(link.studentId);
      const assessment = assessments[assessments.length - 1];
      if (!assessment) break;
      const recommendation = recommendationFor(assessment.profile, career);
      report = buildDecisionReport({
        id: `ephemeral-${token}`,
        studentId: link.studentId,
        studentName: "the student",
        profile: assessment.profile,
        career,
        recommendation,
        locale,
      });
      break;
    }
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader locale={locale} signedIn={Boolean(user)} />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
          <Alert variant="info" title={locale === "te" ? "ఇంకా నివేదిక లేదు" : "Nothing shared yet"}>
            <p>
              {locale === "te"
                ? "ఈ లింక్‌లో చూపించడానికి ఇంకా ప్రణాళిక లేదు."
                : "This link exists but no career plan or report has been published behind it yet."}
            </p>
          </Alert>
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  const snapshot = report.snapshot;
  const career = getCareer(report.careerSlug);
  const cost = career ? estimatedTrainingCost(career) : null;
  const totalCost = snapshot.costs.reduce((sum, item) => sum + item.amountInr, 0);
  const timeline = career
    ? roadmapTimeline(buildRoadmap({ educationLevel: snapshot.educationLevel }, career).steps)
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <Badge variant="accent">{locale === "te" ? "కుటుంబ వీక్షణ — చదవడానికి మాత్రమే" : "Family view — read only"}</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{snapshot.careerTitle}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{snapshot.summary}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="space-y-1 pt-5">
              <p className="text-xs text-[var(--muted-foreground)]">
                {locale === "te" ? "ఇంజిన్ సరిపోలిక" : "Engine fit"}
              </p>
              <p className="text-2xl font-bold tabular-nums">{snapshot.score}%</p>
              <Progress value={snapshot.score} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-5">
              <p className="text-xs text-[var(--muted-foreground)]">
                {locale === "te" ? "అంచనా మొత్తం ఖర్చు" : "Estimated total cost"}
              </p>
              <p className="text-2xl font-bold tabular-nums">₹{totalCost.toLocaleString("en-IN")}</p>
              <QualityBadge quality="illustrative" locale={locale} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 pt-5">
              <p className="text-xs text-[var(--muted-foreground)]">
                {locale === "te" ? "విద్యార్థి" : "Student"}
              </p>
              <p className="text-lg font-semibold">{snapshot.studentName}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {snapshot.educationLevel} · {snapshot.district}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{locale === "te" ? "ఇది ఎందుకు సూచించబడింది" : "Why this was recommended"}</CardTitle>
            <CardDescription>
              {locale === "te" ? "ఇంజిన్ లెక్కించిన అంశాలు" : "Factor scores from the engine, with the weighting it used."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              {snapshot.factors.map((factor) => (
                <div key={factor.factor}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{factor.factor}</span>
                    <span className="text-[var(--muted-foreground)]">
                      {factor.available ? `${Math.round(factor.score * 100)}%` : "—"} · {Math.round(factor.weight * 100)}% wt
                    </span>
                  </div>
                  <Progress value={factor.available ? factor.score * 100 : 0} />
                </div>
              ))}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{locale === "te" ? "బలమైన సరిపోలిక" : "Strong alignment"}</p>
                <ul className="list-disc pl-4 text-[var(--muted-foreground)]">
                  {snapshot.explanation.strongAlignment.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">{locale === "te" ? "పరిగణించండి" : "Considerations"}</p>
                <ul className="list-disc pl-4 text-[var(--muted-foreground)]">
                  {snapshot.considerations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "ఖర్చు విభజన" : "Cost breakdown"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {snapshot.costs.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-[var(--muted-foreground)]">{item.label}</span>
                  <span className="flex items-center gap-2">
                    ₹{item.amountInr.toLocaleString("en-IN")}
                    <QualityBadge quality={item.quality} locale={locale} />
                  </span>
                </div>
              ))}
              {cost ? (
                <p className="pt-2 text-xs text-[var(--muted-foreground)]">
                  {cost.basis}. Verify the current fee with the institution before committing.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-4 w-4" aria-hidden />
                {locale === "te" ? "కాలక్రమం" : "Timeline"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {timeline.length > 0
                ? timeline.map((item) => (
                    <div key={`${item.label}-${item.title}`} className="flex justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">{item.label}</span>
                      <span className="text-right">{item.title}</span>
                    </div>
                  ))
                : snapshot.timeline.map((item) => (
                    <div key={`${item.year}-${item.label}`} className="flex justify-between gap-2">
                      <span className="text-[var(--muted-foreground)]">{item.year}</span>
                      <span className="text-right">{item.label}</span>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" aria-hidden />
              {locale === "te" ? "తరువాత చదువు" : "Further education"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
              {snapshot.furtherEducation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{locale === "te" ? "నైపుణ్యాలు & మూలాలు" : "Skills and sources"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              {snapshot.skillGap.map((row) => (
                <div key={row.skill} className="flex items-center justify-between gap-2">
                  <span>{row.name_en}</span>
                  <span className="text-[var(--muted-foreground)]">
                    {row.known ? `${row.have} → ${row.required}` : locale === "te" ? "రేటింగ్ లేదు" : "not rated"}
                  </span>
                </div>
              ))}
            </div>
            <SourceList sources={snapshot.sources} locale={locale} />
            <Alert variant="warning" title={locale === "te" ? "ముఖ్య గమనిక" : "Important"}>
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden />
                {snapshot.disclaimer}
              </p>
            </Alert>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-[var(--muted-foreground)]">
          {locale === "te"
            ? `ఈ లింక్ ${new Date(link.expiresAt).toLocaleDateString()} నాడు ముగుస్తుంది.`
            : `This share link expires on ${new Date(link.expiresAt).toLocaleDateString()} and can be revoked by the student at any time.`}
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
