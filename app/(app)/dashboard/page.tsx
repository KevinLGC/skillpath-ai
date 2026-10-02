import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Clock, ListChecks, Route, Share2, Target } from "lucide-react";
import { CareerCard } from "@/components/career/career-card";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress, SectionTitle } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/misc";
import { currentLocale } from "@/lib/auth/session";
import { buildRoadmap } from "@/lib/roadmap";
import { getStudentContext } from "@/lib/queries";
import { getCareer } from "@/lib/data";
import { createTranslator } from "@/lib/i18n/messages";

export default async function DashboardPage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const context = await getStudentContext();

  const readiness = context.profile ? Math.round(context.profile.coverage * 100) : 0;
  const top = context.recommendations[0];
  const topCareer = top ? getCareer(top.careerSlug) : undefined;
  const roadmap = context.profile && topCareer ? buildRoadmap(context.profile, topCareer) : null;

  const journey = [
    { label: locale === "te" ? "అసెస్‌మెంట్" : "Assessment", done: Boolean(context.assessment) },
    { label: locale === "te" ? "వృత్తి ఎంపిక" : "Career selection", done: Boolean(top) },
    { label: locale === "te" ? "శిక్షణ" : "Training", done: false },
    { label: locale === "te" ? "సర్టిఫికేషన్" : "Certification", done: false },
    { label: locale === "te" ? "అప్రెంటిస్‌షిప్" : "Apprenticeship", done: false },
    { label: locale === "te" ? "ఉద్యోగం" : "Employment", done: false },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "te" ? `నమస్కారం, ${context.studentName} 👋` : `Good to see you, ${context.studentName} 👋`}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {locale === "te"
              ? "మీ వృత్తి ప్రణాళిక ఒకే చోట: ప్రొఫైల్, సూచనలు, నైపుణ్య లోటు, రోడ్‌మ్యాప్."
              : "Your vocational plan in one place: profile, matches, skill gaps and the roadmap ahead."}
          </p>
        </div>
        {context.isDemoFallback ? (
          <Badge variant="accent">{locale === "te" ? "డెమో విద్యార్థి" : "Seeded demo student"}</Badge>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" aria-hidden />
              {locale === "te" ? "ప్రొఫైల్ పూర్తి స్థాయి" : "Profile completeness"}
            </CardTitle>
            <CardDescription>
              {locale === "te"
                ? "ఎక్కువ సమాధానాలు ఇస్తే సూచనలు మరింత ఖచ్చితంగా ఉంటాయి."
                : "More answered inputs means less of the weighting is excluded — which is exactly what the confidence figure reports."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tabular-nums">{readiness}%</span>
              <span className="text-sm text-[var(--muted-foreground)]">
                {context.profile
                  ? locale === "te"
                    ? `${Object.keys(context.profile.interests).length} ఆసక్తులు · ${Object.keys(context.profile.skills).length} నైపుణ్యాలు నమోదు`
                    : `${Object.keys(context.profile.interests).length} interests · ${Object.keys(context.profile.skills).length} skills recorded`
                  : locale === "te"
                    ? "అసెస్‌మెంట్ ఇంకా పూర్తి కాలేదు"
                    : "Assessment not completed yet"}
              </span>
            </div>
            <Progress value={readiness} tone={readiness >= 75 ? "success" : "primary"} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/assessment">
                <Button size="sm" variant={context.assessment ? "outline" : "default"}>
                  <ListChecks className="h-4 w-4" aria-hidden />
                  {context.assessment
                    ? locale === "te"
                      ? "అసెస్‌మెంట్ మళ్లీ చేయండి"
                      : "Retake assessment"
                    : locale === "te"
                      ? "అసెస్‌మెంట్ ప్రారంభించండి"
                      : "Start assessment"}
                </Button>
              </Link>
              <Link href="/profile">
                <Button size="sm" variant="ghost">
                  {locale === "te" ? "ప్రొఫైల్ చూడండి" : "View profile"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden />
              {locale === "te" ? "ప్రయాణం" : "Your journey"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {journey.map((step) => (
                <li key={step.label} className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" aria-hidden />
                  ) : (
                    <Circle className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
                  )}
                  <span className={step.done ? "font-medium" : "text-[var(--muted-foreground)]"}>{step.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {context.recommendations.length === 0 ? (
        <EmptyState
          title={locale === "te" ? "సూచనలు ఇంకా లేవు" : "No recommendations yet"}
          body={
            locale === "te"
              ? "అసెస్‌మెంట్ పూర్తి చేయండి — వివరణలతో కూడిన సూచనలు వెంటనే కనిపిస్తాయి."
              : "Complete the 2–3 minute assessment and your explained matches appear immediately."
          }
          action={
            <Link href="/assessment" className="mt-2 inline-block">
              <Button>{locale === "te" ? "ప్రారంభించండి" : "Start now"}</Button>
            </Link>
          }
        />
      ) : (
        <div>
          <SectionTitle hint={<Link className="underline" href="/results">{locale === "te" ? "అన్నీ చూడండి" : "See all matches"}</Link>}>
            {locale === "te" ? "అగ్ర సూచనలు" : "Top recommendations"}
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {context.recommendations.slice(0, 3).map((rec, index) => (
              <CareerCard key={rec.careerSlug} recommendation={rec} locale={locale} rank={index + 1} />
            ))}
          </div>
        </div>
      )}

      {roadmap && topCareer && top ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-4 w-4" aria-hidden />
                {locale === "te" ? "రోడ్‌మ్యాప్ — మీరు ఇక్కడ ఉన్నారు" : "Roadmap — you are here"}
              </CardTitle>
              <CardDescription>
                {locale === "te" ? topCareer.title_te : topCareer.title_en} · {t("results.title")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {roadmap.steps.slice(Math.max(0, roadmap.youAreHereIndex - 1), roadmap.youAreHereIndex + 3).map((step, index) => (
                <div
                  key={`${step.stage}-${step.title_en}`}
                  className={
                    index === 1
                      ? "rounded-lg border border-[var(--primary)] bg-[var(--accent)] p-3"
                      : "rounded-lg border border-[var(--border)] p-3"
                  }
                >
                  <p className="font-medium">
                    {index === 1 ? `${t("roadmap.youAreHere")}: ` : ""}
                    {step.title_en}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{step.note_en}</p>
                </div>
              ))}
              <Link href={`/roadmap?career=${topCareer.slug}`} className="inline-block pt-2">
                <Button size="sm" variant="outline">
                  {locale === "te" ? "పూర్తి రోడ్‌మ్యాప్" : "Full roadmap"} <ArrowRight className="h-3 w-3" aria-hidden />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-4 w-4" aria-hidden />
                {locale === "te" ? "కుటుంబంతో పంచుకోండి" : "Bring your family in"}
              </CardTitle>
              <CardDescription>
                {locale === "te"
                  ? "సాధారణ భాషలో వివరణ, ఖర్చు, కాలక్రమం — మరియు 30 రోజుల్లో ముగిసే లింక్."
                  : "A plain-language view with costs, timeline and progression — behind an expiring, revocable link."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert variant="info">
                <p>
                  {locale === "te"
                    ? "కుటుంబ సభ్యులకు ఖాతా అవసరం లేదు; మీరు ఎప్పుడైనా లింక్ రద్దు చేయవచ్చు."
                    : "Family members do not need an account, and you can revoke the link at any time."}
                </p>
              </Alert>
              <Link href={`/family${topCareer ? `?career=${topCareer.slug}` : ""}`}>
                <Button size="sm">
                  {locale === "te" ? "కుటుంబ వీక్షణ తెరవండి" : "Open family view"} <ArrowRight className="h-3 w-3" aria-hidden />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
