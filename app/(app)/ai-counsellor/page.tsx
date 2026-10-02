import { CounsellorChat } from "@/components/ai/counsellor-chat";
import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { currentLocale } from "@/lib/auth/session";
import { aiModeLabel, GEMINI_CHAT_MODEL, RAG_MIN_SIMILARITY } from "@/lib/ai/config";
import { getCareer } from "@/lib/data";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";

export default async function CounsellorPage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const context = await getStudentContext();
  const roleContext = context.user?.role === "family" ? "family" : context.user?.role === "counsellor" ? "counsellor" : "student";

  const topCareer = context.recommendations[0] ? getCareer(context.recommendations[0].careerSlug) : undefined;
  const topTitle = topCareer ? (locale === "te" ? topCareer.title_te : topCareer.title_en) : "vocational pathways";

  const suggested =
    roleContext === "family"
      ? [
          locale === "te" ? "ఈ వృత్తిలో నా బిడ్డ ఏమి చేస్తారు?" : `What does the work of a ${topTitle} actually involve?`,
          locale === "te" ? "శిక్షణ ఖర్చు ఎంత, ఏమి ఉచితంగా ఉండవచ్చు?" : "What training costs are involved, and what support exists?",
          locale === "te" ? "తరువాత చదువు కొనసాగించవచ్చా?" : "Can my child continue education after this?",
          locale === "te" ? "మా కుటుంబం ఏ అంశాలు పరిగణించాలి?" : "What factors should our family consider?",
        ]
      : [
          locale === "te" ? "నాకు ఏ వృత్తి మార్గం సరిపోతుంది?" : "Which vocational pathway suits my profile?",
          locale === "te" ? "అప్రెంటిస్‌షిప్ ఎలా పొందాలి?" : "How do apprenticeships work and how do I apply?",
          locale === "te" ? "నా నైపుణ్య లోటును ఎలా పూరించాలి?" : "How should I close my skill gaps?",
          locale === "te" ? "ఐటీఐ తర్వాత డిప్లొమా చేయవచ్చా?" : "Can I do a diploma after an ITI course?",
          locale === "te" ? "సోలార్ టెక్నీషియన్‌గా అవకాశాలు ఎలా ఉన్నాయి?" : "What opportunities exist for solar technicians?",
        ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("counsellor.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">{t("counsellor.subtitle")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={aiModeLabel() === "gemini" ? "success" : "accent"}>
            {aiModeLabel() === "gemini"
              ? locale === "te"
                ? `మోడల్: ${GEMINI_CHAT_MODEL}`
                : `Grounded generation · ${GEMINI_CHAT_MODEL}`
              : locale === "te"
                ? "మోడల్ లేదు — మూలాల నుండి నేరుగా"
                : "No model configured — answers extracted from sources"}
          </Badge>
          {context.profile ? (
            <Badge variant="outline">
              {locale === "te" ? "మీ ప్రొఫైల్ సందర్భంగా చేర్చబడింది" : "Your profile is attached as context"}
            </Badge>
          ) : null}
        </div>
      </div>

      {aiModeLabel() === "retrieval-only" ? (
        <Alert variant="info" title={locale === "te" ? "మోడల్ లేకుండా పనిచేస్తోంది" : "Running without an AI model"}>
          <p>
            {locale === "te"
              ? "GEMINI_API_KEY సెట్ చేయలేదు. సమాధానాలు అదే నాలెడ్జ్ బేస్ నుండి నేరుగా తీసి, అదే మూలాలతో చూపబడుతున్నాయి."
              : `GEMINI_API_KEY is not set, so answers are extracted directly from the same knowledge base and shown with the same source list. Set the key to enable grounded generation (similarity floor ${RAG_MIN_SIMILARITY}).`}
          </p>
        </Alert>
      ) : null}

      <CounsellorChat locale={locale} roleContext={roleContext} suggestedQuestions={suggested} />

      <Card>
        <CardHeader>
          <CardTitle>{locale === "te" ? "సమాధానాలు ఎక్కడ నుండి వస్తాయి" : "Where these answers come from"}</CardTitle>
          <CardDescription>
            {locale === "te"
              ? "క్యూరేటెడ్ పత్రాలు, ప్రతిదీ అధికారిక పోర్టల్‌కు లింక్ చేయబడింది."
              : "Curated documents, each linking to an official portal, chunked and retrieved before any answer is generated."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)]">
          <ol className="list-decimal space-y-1 pl-5">
            <li>{locale === "te" ? "ప్రశ్న → శోధన (వెక్టర్ లేదా కీవర్డ్)" : "Question → retrieval (pgvector when configured, deterministic keyword search otherwise)"}</li>
            <li>{locale === "te" ? "సంబంధిత భాగాలు మాత్రమే మోడల్‌కు" : "Only chunks above the similarity floor are passed on"}</li>
            <li>{locale === "te" ? "మూలాల లింకులు మీకు చూపబడతాయి" : "Citations are validated: invented markers are dropped before display"}</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
