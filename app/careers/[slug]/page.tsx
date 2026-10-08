import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ExternalLink, GraduationCap, HardHat, MapPin, TrendingUp } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import { Alert, Badge, Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress, SectionTitle } from "@/components/ui/primitives";
import { FactorBars, QualityBadge, SourceList } from "@/components/ui/misc";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { coursesForCareer, documentsForCareer, getCareer, jobsForCareer, localOpportunities } from "@/lib/data";
import { estimatedTrainingCost } from "@/lib/recommendation";
import { getCareerFit } from "@/lib/queries";
import { EDUCATION_LABELS, type AnswerSource, type Locale } from "@/lib/types";

const ENVIRONMENT_LABEL: Record<string, { en: string; te: string }> = {
  workshop: { en: "Workshop / garage", te: "వర్క్‌షాప్" },
  factory: { en: "Factory / production", te: "కర్మాగారం" },
  field: { en: "Field service", te: "క్షేత్ర సేవ" },
  site: { en: "Construction site", te: "నిర్మాణ సైట్" },
  lab: { en: "Laboratory", te: "ప్రయోగశాల" },
  healthcare: { en: "Hospital / clinic", te: "ఆసుపత్రి / క్లినిక్" },
  office: { en: "Office / studio", te: "ఆఫీస్ / స్టూడియో" },
  studio: { en: "Design studio", te: "డిజైన్ స్టూడియో" },
  outdoor: { en: "Outdoors", te: "బహిరంగ ప్రదేశం" },
  hospitality: { en: "Hotel / restaurant", te: "హోటల్ / రెస్టారెంట్" },
};

export default async function CareerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const career = getCareer(slug);
  if (!career) notFound();

  const locale: Locale = await currentLocale();
  const user = await getSessionUser();
  const fit = await getCareerFit(slug);
  const cost = estimatedTrainingCost(career);
  const courses = coursesForCareer(slug);
  const jobs = jobsForCareer(slug);
  const documents = documentsForCareer(slug).slice(0, 4);

  const opportunities = localOpportunities({ careerSlug: slug });

  const sources: AnswerSource[] = documents.map((doc, index) => ({
    marker: `S${index + 1}`,
    title: doc.title,
    sourceOrg: doc.source_org,
    sourceUrl: doc.source_url,
    retrievedAt: doc.retrieved_at,
    dataQuality: doc.data_quality,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <nav className="mb-4 text-sm text-[var(--muted-foreground)]">
          <Link className="hover:underline" href="/careers">
            {locale === "te" ? "వృత్తులు" : "Careers"}
          </Link>
          <span className="mx-2">/</span>
          <span>{locale === "te" ? career.title_te : career.title_en}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{ENVIRONMENT_LABEL[career.work_environment]?.[locale] ?? career.work_environment}</Badge>
                <Badge variant="outline">
                  {career.duration_months_min}–{career.duration_months_max} {locale === "te" ? "నెలలు" : "months"}
                </Badge>
                <QualityBadge quality={career.data_quality} locale={locale} />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">{locale === "te" ? career.title_te : career.title_en}</h1>
              <p className="mt-3 text-[var(--muted-foreground)]">{locale === "te" ? career.summary_te : career.summary_en}</p>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">{career.work_en}</p>
            </div>

            {fit ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === "te" ? "మీ ప్రొఫైల్‌కు ఎలా సరిపోతుంది" : "How this fits the current profile"}
                  </CardTitle>
                  <CardDescription>
                    {locale === "te"
                      ? `ఇంజిన్ స్కోరు ${fit.recommendation.score}% · ${Math.round(fit.recommendation.confidence * 100)}% బరువు ఆధారంగా`
                      : `Engine score ${fit.recommendation.score}% · based on ${Math.round(fit.recommendation.confidence * 100)}% of the weighting`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FactorBars contributions={fit.recommendation.contributions} locale={locale} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <ExplanationList title={locale === "te" ? "బలమైన సరిపోలిక" : "Strong alignment"} items={fit.recommendation.explanation.strongAlignment} />
                    <ExplanationList title={locale === "te" ? "పరిగణించండి" : "Considerations"} items={fit.recommendation.explanation.considerations} />
                    <ExplanationList title={locale === "te" ? "మెరుగుపరచాల్సినవి" : "Skills to improve"} items={fit.recommendation.explanation.skillsToImprove} />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">{fit.recommendation.explanation.confidenceNote}</p>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href={`/compare?a=${career.slug}`} variant="outline" size="sm">
                        {locale === "te" ? "పోల్చండి" : "Compare"}
                      </ButtonLink>
                    <ButtonLink href={`/roadmap?career=${career.slug}`} variant="outline" size="sm">
                        {locale === "te" ? "రోడ్‌మ్యాప్" : "Roadmap"}
                      </ButtonLink>
                    <ButtonLink href={`/skill-gap?career=${career.slug}`} variant="outline" size="sm">
                        {locale === "te" ? "నైపుణ్య లోటు" : "Skill gap"}
                      </ButtonLink>
                    <ButtonLink href={`/family?career=${career.slug}`} size="sm">{locale === "te" ? "కుటుంబంతో పంచుకోండి" : "Share with family"}</ButtonLink>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert title={locale === "te" ? "అసెస్‌మెంట్ పూర్తి చేయండి" : "Complete the assessment"}>
                <p>
                  {locale === "te"
                    ? "మీ సరిపోలిక స్కోరు, కారణాలు మరియు నైపుణ్య లోటు చూడటానికి అసెస్‌మెంట్ పూర్తి చేయండి."
                    : "Finish the assessment to see your fit score, the factors behind it and your skill gap for this pathway."}
                </p>
                <ButtonLink className="mt-2 inline-block" href="/assessment" size="sm">{locale === "te" ? "అసెస్‌మెంట్ ప్రారంభించండి" : "Start the assessment"}</ButtonLink>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" aria-hidden />
                  {locale === "te" ? "వృత్తి ఎదుగుదల" : "Career progression"}
                </CardTitle>
                <CardDescription>
                  {locale === "te" ? "కాలక్రమంలో దశలు" : "Stages over time, with durations where known"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {career.pathways.map((stage) => (
                    <li key={stage.stage} className="rounded-lg border border-[var(--border)] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="muted">{stage.type.replace("_", " ")}</Badge>
                        <span className="font-medium">{locale === "te" ? stage.title_te : stage.title_en}</span>
                        {stage.duration_months ? (
                          <span className="text-xs text-[var(--muted-foreground)]">{stage.duration_months} mo</span>
                        ) : null}
                        {stage.optional ? <Badge variant="outline">{locale === "te" ? "ఐచ్ఛికం" : "Optional"}</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{stage.note_en}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                  {locale === "te" ? "అదనపు విద్య" : "Further education"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
                  {career.further_education_en.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{locale === "te" ? "అవసరమైన నైపుణ్యాలు" : "Skills this pathway expects"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {career.skills.map((requirement) => {
                  const gapRow = fit?.recommendation.skillGap.find((row) => row.skill === requirement.slug);
                  return (
                    <div key={requirement.slug}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{gapRow?.name_en ?? requirement.slug}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {locale === "te" ? "అవసరం" : "required"} {requirement.level}/100
                          {gapRow?.known ? ` · ${locale === "te" ? "మీరు" : "you"} ${gapRow.have}/100` : ` · ${locale === "te" ? "రేటింగ్ లేదు" : "not rated"}`}
                        </span>
                      </div>
                      <Progress value={requirement.level} tone={requirement.priority ? "primary" : "success"} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{locale === "te" ? "సంక్షిప్త సమాచారం" : "At a glance"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label={locale === "te" ? "కనీస అర్హత" : "Entry requirement"} value={EDUCATION_LABELS[career.min_education_level][locale]} locale={locale} />
                <Row
                  label={locale === "te" ? "శిక్షణ ఖర్చు (ఉదాహరణ)" : "Training cost (illustrative)"}
                  value={`₹${cost.amountInr.toLocaleString("en-IN")}`}
                  quality={cost.quality}
                  locale={locale}
                />
                <Row
                  label={locale === "te" ? "ప్రారంభ ఆదాయం (ఉదాహరణ)" : "Starting income (illustrative)"}
                  value={`₹${career.income_band_min.toLocaleString("en-IN")} – ₹${career.income_band_max.toLocaleString("en-IN")} / ${locale === "te" ? "నెల" : "month"}`}
                  quality="illustrative"
                  locale={locale}
                />
                <Row
                  label={locale === "te" ? "తరలింపు అవసరం" : "Relocation likelihood"}
                  value={career.relocation_likelihood}
                  locale={locale}
                />
                <Row
                  label={locale === "te" ? "స్వయం ఉపాధి" : "Self-employment"}
                  value={career.entrepreneurship}
                  locale={locale}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardHat className="h-4 w-4" aria-hidden />
                  {locale === "te" ? "పరిగణించవలసినవి" : "Considerations"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
                  {career.considerations_en.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" aria-hidden />
                  {locale === "te" ? "కోర్సులు & సంస్థలు" : "Courses & institutions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courses.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {locale === "te" ? "నమూనా డేటాలో కోర్సులు లేవు." : "No seeded courses for this pathway."}
                  </p>
                ) : (
                  courses.map((course) => (
                    <div key={course.slug} className="rounded-lg border border-[var(--border)] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{locale === "te" ? course.title_te : course.title_en}</span>
                        <QualityBadge quality={course.data_quality} locale={locale} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {course.institution?.name} · {course.duration_months} mo · ₹{course.cost_inr.toLocaleString("en-IN")} ·{" "}
                        {course.eligibility_en}
                      </p>
                      <a
                        className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--primary)] underline"
                        href={course.source_url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {locale === "te" ? "అధికారిక పోర్టల్" : "Official portal"} <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {locale === "te" ? "ఉద్యోగ అవకాశాలు (ఉదాహరణ)" : "Example job roles"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.slug} className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-sm font-medium">{locale === "te" ? job.role_title_te : job.role_title_en}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {job.region} · ₹{job.salary_min_inr.toLocaleString("en-IN")}–{job.salary_max_inr.toLocaleString("en-IN")} ·{" "}
                      {job.employer_type}
                    </p>
                    <div className="mt-1">
                      <QualityBadge quality={job.data_quality} locale={locale} />
                    </div>
                  </div>
                ))}
                {jobs.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">{locale === "te" ? "నమూనా డేటా లేదు." : "No seeded roles."}</p>
                ) : null}
              </CardContent>
            </Card>

            {opportunities.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{locale === "te" ? "స్థానిక అవకాశాలు" : "Local opportunities"}</CardTitle>
                  <CardDescription>
                    {locale === "te" ? "ఇన్‌స్టిట్యూట్లు, కోర్సులు, ఉద్యోగాలు" : "Institutions, courses and roles in the seed data"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {opportunities.slice(0, 6).map((item) => (
                    <div key={`${item.kind}-${item.label}`} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{item.detail}</p>
                      </div>
                      <QualityBadge quality={item.quality} locale={locale} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>{locale === "te" ? "మూలాలు" : "Sources"}</CardTitle>
              </CardHeader>
              <CardContent>
                <SourceList sources={sources} locale={locale} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

function Row({
  label,
  value,
  quality,
  locale,
}: {
  label: string;
  value: string;
  quality?: "sourced" | "estimated" | "illustrative" | "guidance";
  locale: Locale;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="flex flex-wrap items-center justify-end gap-2 text-right font-medium">
        {value}
        {quality ? <QualityBadge quality={quality} locale={locale} /> : null}
      </span>
    </div>
  );
}

function ExplanationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">—</p>
      ) : (
        <ul className="list-disc space-y-1 pl-4 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
