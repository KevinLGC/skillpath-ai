import { Alert, Badge, Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { EmptyState, RoadmapTimeline } from "@/components/ui/misc";
import { currentLocale } from "@/lib/auth/session";
import { coursesForCareer, getCareer } from "@/lib/data";
import { buildRoadmap, roadmapTimeline } from "@/lib/roadmap";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ career?: string }> }) {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const params = await searchParams;
  const context = await getStudentContext();

  const slug = params.career ?? context.recommendations[0]?.careerSlug;
  const career = slug ? getCareer(slug) : undefined;

  if (!context.profile || !career) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("roadmap.title")}</h1>
        <EmptyState
          title={locale === "te" ? "రోడ్‌మ్యాప్ కోసం ఒక వృత్తి ఎంచుకోండి" : "Choose a career to build a roadmap"}
          body={
            locale === "te"
              ? "అసెస్‌మెంట్ పూర్తి చేసి, ఫలితాల నుండి ఒక వృత్తిని ఎంచుకోండి — అప్పుడు కాలక్రమ రోడ్‌మ్యాప్ తయారవుతుంది."
              : "Complete the assessment, then open any matched career to see its step-by-step roadmap."
          }
          action={
            <ButtonLink href="/results" className="mt-2 inline-block" size="sm">{locale === "te" ? "సూచనలు చూడండి" : "See my matches"}</ButtonLink>
          }
        />
      </div>
    );
  }

  const { steps, youAreHereIndex } = buildRoadmap(context.profile, career);
  const timeline = roadmapTimeline(steps);
  const courses = coursesForCareer(career.slug).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("roadmap.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
          {locale === "te"
            ? "మీ ప్రస్తుత విద్య దశ నుండి ఉద్యోగం వరకు దశలు. ప్రతి దశకు మూల లేబుల్ ఉంటుంది."
            : "Stages from where you are now to employment and progression. Every step keeps its provenance label."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{locale === "te" ? career.title_te : career.title_en}</Badge>
          <Badge variant="outline">{context.profile.educationLevel}</Badge>
          <Badge variant="outline">{t("roadmap.youAreHere")}: {steps[youAreHereIndex]?.title_en}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "te" ? "దశల వారీ ప్రణాళిక" : "Step-by-step plan"}</CardTitle>
            <CardDescription>
              {locale === "te" ? "కాలాలు సూచనాత్మకం" : "Durations are carried from the pathway data and remain indicative."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoadmapTimeline steps={steps} youAreHereIndex={youAreHereIndex} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "సంవత్సరాల వారీగా" : "Year by year"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {timeline.length === 0 ? (
                <p className="text-[var(--muted-foreground)]">
                  {locale === "te" ? "అన్ని దశలు పూర్తయ్యాయి." : "All stages already completed."}
                </p>
              ) : (
                timeline.map((item, index) => (
                  <div key={`${item.label}-${item.title}`} className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0">
                    <span className="text-[var(--muted-foreground)]">{item.label}</span>
                    <span className="text-right">
                      {item.title}
                      {item.optional ? <Badge variant="muted" className="ml-2">optional</Badge> : null}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {courses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{locale === "te" ? "మొదటి అడుగు: కోర్సులు" : "First step: courses to look at"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {courses.map((course) => (
                  <div key={course.slug} className="rounded-lg border border-[var(--border)] p-3">
                    <p className="font-medium">{locale === "te" ? course.title_te : course.title_en}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {course.institution?.name} · {course.duration_months} mo · ₹{course.cost_inr.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Alert variant="warning" title={locale === "te" ? "ధృవీకరించండి" : "Verify before you commit"}>
            <p>
              {locale === "te"
                ? "కోర్సు ఫీజులు, అర్హతలు మరియు ప్రవేశ విధానం ప్రతి సంవత్సరం మారవచ్చు. సంస్థతో లేదా అధికారిక పోర్టల్‌తో నిర్ధారించుకోండి."
                : "Course fees, eligibility and admission rules change every year. Confirm with the institution or the official portal — the figures here are labelled demonstration data."}
            </p>
          </Alert>
        </div>
      </div>
    </div>
  );
}
