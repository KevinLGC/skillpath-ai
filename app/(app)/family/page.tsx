import Link from "next/link";
import { GraduationCap, Info, Route, TrendingUp } from "lucide-react";
import { CounsellorChat } from "@/components/ai/counsellor-chat";
import { CostSimulator } from "@/components/family/cost-simulator";
import { ReportGenerator } from "@/components/family/report-button";
import { SharePanel } from "@/components/family/share-panel";
import { TrustCertificate } from "@/components/family/trust-certificate";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  SectionTitle,
} from "@/components/ui/primitives";
import { EmptyState, QualityBadge } from "@/components/ui/misc";
import { currentLocale } from "@/lib/auth/session";
import { coursesForCareer, documentsForCareer, getCareer, jobsForCareer } from "@/lib/data";
import { roadmapTimeline } from "@/lib/roadmap";
import { buildRoadmap } from "@/lib/roadmap";
import { estimatedTrainingCost, LIVING_COST_ESTIMATE_INR, recommendationFor } from "@/lib/recommendation";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";

export default async function FamilyPage({ searchParams }: { searchParams: Promise<{ career?: string }> }) {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const params = await searchParams;
  const context = await getStudentContext();

  const slug = params.career ?? context.recommendations[0]?.careerSlug;
  const career = slug ? getCareer(slug) : undefined;

  if (!context.profile || !career) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("family.title")}</h1>
        <EmptyState
          title={locale === "te" ? "చూపించడానికి ప్రణాళిక లేదు" : "No plan to explain yet"}
          body={
            locale === "te"
              ? "విద్యార్థి అసెస్‌మెంట్ పూర్తి చేసిన తర్వాత ఇక్కడ సాధారణ భాషలో వివరణ కనిపిస్తుంది."
              : "Once the student completes the assessment, this page explains the chosen pathway in plain language for the family."
          }
          action={
            <Link href="/assessment" className="mt-2 inline-block">
              <Button size="sm">{t("home.hero.cta")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const recommendation = recommendationFor(context.profile, career);
  const cost = estimatedTrainingCost(career);
  const { steps } = buildRoadmap(context.profile, career);
  const timeline = roadmapTimeline(steps);
  const courses = coursesForCareer(career.slug).slice(0, 3);
  const jobs = jobsForCareer(career.slug).slice(0, 3);
  const documents = documentsForCareer(career.slug).slice(0, 3);

  const familyQuestions = [
    locale === "te" ? "ఈ పనిలో రోజువారీ ఏమి చేస్తారు?" : `What does a ${career.title_en} do day to day?`,
    locale === "te" ? "శిక్షణకు మొత్తం ఖర్చు ఎంత?" : "What is the total cost of training?",
    locale === "te" ? "ఇది పూర్తయ్యాక ఇంకా చదువుకోవచ్చా?" : "Can my child study further after this?",
    locale === "te" ? "ఉద్యోగ అవకాశాలు ఎలా ఉన్నాయి?" : "What are the job prospects and progression?",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("family.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">{t("family.subtitle")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="accent">{locale === "te" ? career.title_te : career.title_en}</Badge>
          <Badge variant="outline">
            {locale === "te" ? `సరిపోలిక ${recommendation.score}%` : `Engine fit ${recommendation.score}%`}
          </Badge>
          <QualityBadge quality={career.data_quality} locale={locale} />
        </div>
      </div>

      <Alert variant="info" title={locale === "te" ? "ఇది సూచన, ఆదేశం కాదు" : "This is guidance, not an instruction"}>
        <p>
          {locale === "te"
            ? "ఈ వృత్తి మీ కుటుంబానికి సరిపోతుందా అనేది మీరు నిర్ణయించాలి. ఇక్కడ ప్రయోజనాలు, పరిగణనలు రెండూ చూపుతున్నాము."
            : "Whether this pathway suits your family is your decision. This page shows both the advantages and the trade-offs, with the source of every figure."}
        </p>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "ఈ పని అంటే ఏమిటి" : "What this work involves"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>{locale === "te" ? career.summary_te : career.summary_en}</p>
              <p>{career.work_en}</p>
              <p className="flex items-center gap-2 text-xs">
                <Info className="h-3 w-3" aria-hidden />
                {locale === "te" ? "పని ప్రదేశం" : "Work environment"}: {career.work_environment}
              </p>
            </CardContent>
          </Card>

          <CostSimulator
            locale={locale}
            trainingCostInr={cost.amountInr}
            durationMonthsMin={career.duration_months_min}
            durationMonthsMax={career.duration_months_max}
            monthlyLivingInr={Math.round((LIVING_COST_ESTIMATE_INR / 12) / 100) * 100}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-4 w-4" aria-hidden />
                {locale === "te" ? "సంవత్సరాల వారీ ప్రణాళిక" : "Year by year"}
              </CardTitle>
              <CardDescription>
                {locale === "te" ? "మీ బిడ్డ ఇప్పుడు ఎక్కడ ఉన్నారు" : "Where the student is now, and what comes next"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {timeline.map((item) => (
                <div key={`${item.label}-${item.title}`} className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0">
                  <span className="shrink-0 font-medium">{item.label}</span>
                  <span className="text-right text-[var(--muted-foreground)]">{item.title}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" aria-hidden />
                {locale === "te" ? "ఎదుగుదల" : "Progression and income (illustrative)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {career.pathways.map((stage) => (
                <div key={stage.stage} className="flex items-start justify-between gap-3">
                  <span>{stage.title_en}</span>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{stage.duration_months ? `${stage.duration_months} mo` : "ongoing"}</span>
                </div>
              ))}
              <p className="pt-2 text-xs text-[var(--muted-foreground)]">
                {locale === "te" ? "ఉదాహరణ ప్రారంభ ఆదాయం" : "Illustrative starting range"}: ₹
                {career.income_band_min.toLocaleString("en-IN")}–{career.income_band_max.toLocaleString("en-IN")}{" "}
                {locale === "te" ? "నెలకు" : "per month"} — <QualityBadge quality="illustrative" locale={locale} />
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {locale === "te"
                  ? "జీతం హామీ కాదు; ఉద్యోగం, నగరం, నైపుణ్యంపై ఆధారపడుతుంది."
                  : "Not a guarantee: actual pay depends on employer, city, skill level and demand."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" aria-hidden />
                {locale === "te" ? "తరువాత చదువు" : "Further education options"}
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
              <CardTitle>{locale === "te" ? "నైపుణ్య లోటు (సాధారణ భాషలో)" : "What needs to be learned"}</CardTitle>
              <CardDescription>
                {locale === "te" ? "ఇప్పుడు ఉన్న స్థాయి → అవసరమైన స్థాయి" : "Current level → level this pathway expects"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendation.skillGap.slice(0, 5).map((row) => (
                <div key={row.skill}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{row.name_en}</span>
                    <span className="text-[var(--muted-foreground)]">
                      {row.known ? `${row.have} → ${row.required}` : locale === "te" ? "రేటింగ్ లేదు" : "not rated"}
                    </span>
                  </div>
                  <Progress value={row.known ? (row.have ?? 0) : 0} tone={row.gap > 20 ? "warning" : "success"} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <SharePanel locale={locale} careerSlug={career.slug} careerTitle={locale === "te" ? career.title_te : career.title_en} />

          <ReportGenerator locale={locale} careerSlug={career.slug} careerTitle={locale === "te" ? career.title_te : career.title_en} />

          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "మీరు అడగాల్సిన ప్రశ్నలు" : "Ask the counsellor"}</CardTitle>
              <CardDescription>
                {locale === "te"
                  ? "కుటుంబ సందర్భంలో, సులభమైన భాషలో సమాధానాలు — మూలాలతో."
                  : "Answers framed for families, with sources attached."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CounsellorChat locale={locale} roleContext="family" suggestedQuestions={familyQuestions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "కోర్సులు & ఉద్యోగ ఉదాహరణలు" : "Courses and example roles"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {courses.map((course) => (
                <div key={course.slug} className="rounded-lg border border-[var(--border)] p-3">
                  <p className="font-medium">{course.title_en}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {course.institution?.name} · {course.duration_months} mo · ₹{course.cost_inr.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
              {jobs.map((job) => (
                <div key={job.slug} className="rounded-lg border border-[var(--border)] p-3">
                  <p className="font-medium">{job.role_title_en}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {job.region} · ₹{job.salary_min_inr.toLocaleString("en-IN")}–{job.salary_max_inr.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "ఈ వివరణల మూలాలు" : "Where this explanation comes from"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {documents.map((doc) => (
                <div key={doc.id}>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {doc.source_org} ·{" "}
                    <a className="underline" href={doc.source_url} target="_blank" rel="noreferrer noopener">
                      official source
                    </a>
                  </p>
                  <div className="mt-1">
                    <QualityBadge quality={doc.data_quality} locale={locale} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3-Year ROI Simulator Callout */}
      <Card className="border-[var(--primary)]/20 bg-gradient-to-r from-[var(--primary)]/10 via-[var(--card)] to-[var(--secondary)]/40 p-1">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success">{locale === "te" ? "+₹7.35 లక్షల సంపాదన ప్రయోజనం" : "+₹7.35 Lakh Net Advantage"}</Badge>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">NSQF vs 3-Yr BA/BCom</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {locale === "te" ? "3-సంవత్సరాల ఆర్థిక వాస్తవికత & ROI సిమ్యులేటర్" : "3-Year Financial Reality & ROI Simulator"}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-2xl">
              {locale === "te"
                ? "సాధారణ నాన్-టెక్నికల్ డిగ్రీ అప్పులను ప్రభుత్వ-సబ్సిడీతో కూడిన ఎన్ఎస్ క్యూ ఎఫ్ స్టైపెండ్‌లతో పోల్చండి. తెలుగు లేదా ఇంగ్లీషులో ఆడియో వివరణ వినండి."
                : "Simulate cash flow, live stipends, lateral entry into Engineering Diplomas, and medical coverage with speech narration."}
            </p>
          </div>
          <Link href="/roi" className="shrink-0">
            <Button size="md" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              {locale === "te" ? "సిమ్యులేటర్ తెరవండి" : "Open ROI Simulator"}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Family Vocational Trust Certificate */}
      <div id="certificate" className="space-y-3 pt-4">
        <SectionTitle hint={locale === "te" ? "బంధువులు మరియు సమాజం కోసం అధికారిక ధృవీకరణ" : "Social proof and legal guarantees for extended family"}>
          {locale === "te" ? "కుటుంబ వృత్తి నైపుణ్య విశ్వాస పత్రం" : "Family Vocational Trust Certificate"}
        </SectionTitle>
        <p className="text-xs text-[var(--muted-foreground)]">
          {locale === "te"
            ? "సమాజంలో 'మిస్త్రీ' లేదా తక్కువ పని అనే భావనను తొలగించడానికి మరియు వాట్సాప్‌లో బంధువులతో పంచుకోవడానికి అధికారిక NCVT & NEP 2020 సర్టిఫికేట్."
            : "Refute social stigma with verifiable NSQF/NCVT credentials, 3-year salary progression, and 1-click WhatsApp sharing for relatives."}
        </p>
        <TrustCertificate
          locale={locale}
          defaultStudentName={context.studentName || (locale === "te" ? "రాహుల్ వర్మ" : "Rahul Varma")}
          defaultDistrict={context.profile.constraints.district || "Visakhapatnam"}
        />
      </div>

      <SectionTitle hint={locale === "te" ? "అంశాలను కలిపి చర్చించండి" : "Compare before deciding together"}>
        {locale === "te" ? "తదుపరి అడుగు" : "Next step"}
      </SectionTitle>
      <div className="flex flex-wrap gap-2">
        <Link href="/roi">
          <Button variant="default" size="sm">
            <TrendingUp className="h-4 w-4" />
            {locale === "te" ? "ROI సిమ్యులేటర్" : "3-Yr ROI Simulator"}
          </Button>
        </Link>
        <Link href={`/compare?a=${career.slug}`}>
          <Button variant="outline" size="sm">
            {locale === "te" ? "ఇతర మార్గాలతో పోల్చండి" : "Compare with other pathways"}
          </Button>
        </Link>
        <Link href={`/roadmap?career=${career.slug}`}>
          <Button variant="outline" size="sm">
            {locale === "te" ? "పూర్తి రోడ్‌మ్యాప్" : "Full roadmap"}
          </Button>
        </Link>
        <Link href="/ai-counsellor">
          <Button variant="ghost" size="sm">
            {locale === "te" ? "ఏఐ కౌన్సెలర్" : "AI counsellor"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
