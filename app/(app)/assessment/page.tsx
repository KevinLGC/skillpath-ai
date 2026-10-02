import { AssessmentRunner } from "@/components/assessment/assessment-runner";
import { Alert, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { currentLocale } from "@/lib/auth/session";
import { questions } from "@/lib/data";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";

const DISTRICTS = [
  "Visakhapatnam",
  "Vijayawada",
  "Guntur",
  "Nellore",
  "Tirupati",
  "Kurnool",
  "Kadapa",
  "Anantapur",
  "Rajahmundry",
  "Kakinada",
  "Sri City",
];

export default async function AssessmentPage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const context = await getStudentContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("assessment.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">{t("assessment.intro")}</p>
      </div>

      {context.assessment ? (
        <Alert variant="info" title={locale === "te" ? "మునుపటి ఫలితాలు ఉన్నాయి" : "You already have results"}>
          <p>
            {locale === "te"
              ? "కొత్త అసెస్‌మెంట్ పూర్తి చేస్తే కొత్త ప్రొఫైల్ ప్రకారం సూచనలు మారుతాయి; పాత ప్రణాళిక భద్రంగా ఉంటుంది."
              : "Submitting again replaces your working profile and re-ranks the matches. Your previous recommendation trace stays stored, so nothing is silently rewritten."}
          </p>
        </Alert>
      ) : null}

      <AssessmentRunner
        questions={questions}
        locale={locale}
        districts={DISTRICTS}
        initialEducation={context.profile?.educationLevel}
      />

      <Card>
        <CardHeader>
          <CardTitle>{locale === "te" ? "ఇది ఎలా ఉపయోగించబడుతుంది" : "How your answers are used"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>
            {locale === "te"
              ? "సమాధానాలు నిర్మిత ప్రొఫైల్‌గా మార్చబడతాయి (ఆసక్తులు, సామర్థ్యం, నైపుణ్యాలు, ప్రాధాన్యతలు) — అదే మ్యాచింగ్ ఇంజిన్ ఇన్‌పుట్."
              : "Answers are normalized into a structured profile — interests, aptitude, self-rated skills and preferences — which is the only input the matching engine receives."}
          </p>
          <p>
            {locale === "te"
              ? "ఏఐ ప్రశ్నలకు సమాధానం ఇవ్వదు; మీ ప్రొఫైల్‌ను మాత్రం కౌన్సెలర్ సందర్భంగా ఉపయోగిస్తుంది."
              : "No AI model scores your answers. The assistant only sees a compact summary of the resulting profile so its answers stay relevant."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
