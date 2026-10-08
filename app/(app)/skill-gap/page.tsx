import { Alert, Badge, Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/misc";
import { currentLocale } from "@/lib/auth/session";
import { coursesForCareer, getCareer } from "@/lib/data";
import { computeSkillGap, gapSummary, learningPlan } from "@/lib/skill-gap";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";

export default async function SkillGapPage({ searchParams }: { searchParams: Promise<{ career?: string }> }) {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const params = await searchParams;
  const context = await getStudentContext();

  const slug = params.career ?? context.recommendations[0]?.careerSlug;
  const career = slug ? getCareer(slug) : undefined;

  if (!context.profile || !career) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("skillGap.title")}</h1>
        <EmptyState
          title={locale === "te" ? "ముందు అసెస్‌మెంట్ పూర్తి చేయండి" : "Complete the assessment first"}
          body={
            locale === "te"
              ? "మీ స్వీయ-నైపుణ్య రేటింగ్‌లు లేకుండా నైపుణ్య లోటును లెక్కించలేము — మేము ఊహించము."
              : "Skill gaps need your self-rated skills. Without them we show nothing rather than inventing a gap."
          }
          action={
            <ButtonLink href="/assessment" className="mt-2 inline-block" size="sm">{t("home.hero.cta")}</ButtonLink>
          }
        />
      </div>
    );
  }

  const gap = computeSkillGap(context.profile, career);
  const summary = gapSummary(gap);
  const plan = learningPlan(gap);
  const courses = coursesForCareer(career.slug).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("skillGap.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
          {locale === "te"
            ? `మీ స్వీయ-రేటింగ్‌లు మరియు ${career.title_te} మార్గానికి అవసరమైన స్థాయిల మధ్య వ్యత్యాసం.`
            : `Your self-ratings compared with what ${career.title_en} expects. Unrated skills are shown as "not rated" — never as a zero.`}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "te" ? "మీరు vs అవసరం" : "You vs the requirement"}</CardTitle>
            <CardDescription>
              {locale === "te"
                ? `${summary.knownGaps} నైపుణ్యాల్లో లోటు · ${summary.unknown} నైపుణ్యాలు ఇంకా రేట్ చేయలేదు`
                : `${summary.knownGaps} gaps found · ${summary.unknown} skills not rated yet`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gap.map((row) => (
              <div key={row.skill}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{row.name_en}</span>
                  <span className="text-[var(--muted-foreground)]">
                    {row.known ? `${row.have}/100 → ${row.required}/100` : locale === "te" ? "రేటింగ్ లేదు" : "not rated"}
                    {row.priority ? <Badge variant="warning" className="ml-2">priority</Badge> : null}
                    {row.known && row.gap === 0 ? <Badge variant="success" className="ml-2">met</Badge> : null}
                  </span>
                </div>
                <Progress value={row.known ? (row.have ?? 0) : 0} tone={row.gap > 20 ? "warning" : "success"} />
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {locale === "te" ? "అవసరమైన స్థాయి" : "required level"}: {row.required}/100
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("skillGap.plan")}</CardTitle>
              <CardDescription>
                {locale === "te"
                  ? "ప్రాధాన్యత ఉన్న నైపుణ్యాలు మొదట, తర్వాత పెద్ద లోటు ఉన్నవి."
                  : "Priority skills first, then the largest gaps. Built only from measured gaps."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plan.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">{t("skillGap.noGap")}</p>
              ) : (
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {plan.map((row) => (
                    <li key={row.skill}>
                      <span className="font-medium">{row.name_en}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {" "}
                        — {locale === "te" ? "లోటు" : "gap"} {row.gap} {locale === "te" ? "పాయింట్లు" : "points"}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {courses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{locale === "te" ? "ఈ లోటును పూరించే కోర్సులు" : "Courses that could close these gaps"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {courses.map((course) => (
                  <div key={course.slug} className="rounded-lg border border-[var(--border)] p-3">
                    <p className="font-medium">{locale === "te" ? course.title_te : course.title_en}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {course.institution?.name} · {course.duration_months} mo · ₹{course.cost_inr.toLocaleString("en-IN")} ·{" "}
                      {course.eligibility_en}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {summary.unknown > 0 ? (
            <Alert variant="info" title={locale === "te" ? "రేటింగ్ లేని నైపుణ్యాలు" : "Some skills are still unrated"}>
              <p>
                {locale === "te"
                  ? "అసెస్‌మెంట్ మళ్లీ చేసి ఆ నైపుణ్యాలను రేట్ చేయండి — అప్పుడు ప్రణాళిక మరింత కచ్చితంగా ఉంటుంది."
                  : "Retake the assessment and rate them to make this plan more precise. Until then they stay excluded rather than counted as a gap."}
              </p>
              <ButtonLink href="/assessment" className="mt-2 inline-block" size="sm" variant="outline">
                  {locale === "te" ? "అసెస్‌మెంట్ అప్‌డేట్" : "Update answers"}
                </ButtonLink>
            </Alert>
          ) : null}
        </div>
      </div>
    </div>
  );
}
