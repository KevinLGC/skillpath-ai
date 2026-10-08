import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import { Alert, Button, ButtonLink, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { DEFAULT_WEIGHTS, ENGINE_VERSION, FACTOR_LABELS } from "@/lib/recommendation";
import { createTranslator } from "@/lib/i18n/messages";

export default async function HowItWorksPage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const user = await getSessionUser();

  const factors = Object.entries(DEFAULT_WEIGHTS).filter(([, weight]) => weight > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("home.how.title")}</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          {locale === "te"
            ? "స్కిల్‌పాత్ ఏఐ ఎలా నిర్ణయాలు తీసుకుంటుందో — మరియు ఏమి చేయదో — పారదర్శకంగా."
            : "Exactly how SkillPath AI reaches a recommendation — and what it deliberately does not do."}
        </p>

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "1. అసెస్‌మెంట్" : "1. Assessment"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>
                {locale === "te"
                  ? "24 ప్రశ్నలు: ఆసక్తులు, సామర్థ్యం, స్వీయ-నైపుణ్య అంచనాలు, పని ప్రాధాన్యతలు. తరువాత మీ పరిస్థితి (బడ్జెట్, కాలపరిమితి, జిల్లా)."
                  : "24 questions covering interests, aptitude, self-rated skills and work preferences, followed by your situation — budget, training duration, location and minimum expected income."}
              </p>
              <p>
                {locale === "te"
                  ? "తెలియని వాటిని ఖాళీగా వదిలేయవచ్చు. ఖాళీ వివరాలు 0గా పరిగణించబడవు — అవి లెక్కల్లో చేర్చబడవు."
                  : "Any field you leave blank is treated as unknown and excluded from scoring — never silently scored as zero."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "2. స్కోరింగ్ ఇంజిన్" : "2. The scoring engine"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
              <p>
                {locale === "te"
                  ? `ప్రతి వృత్తికి ఆరు అంశాలపై 0–1 స్కోరు లెక్కించి, బరువులతో కలుపుతాము (ఇంజిన్ వెర్షన్ ${ENGINE_VERSION}).`
                  : `Each career is scored 0–1 on six factors, then combined using configurable weights (engine version ${ENGINE_VERSION}).`}
              </p>
              <ul className="space-y-1">
                {factors.map(([factor, weight]) => (
                  <li key={factor} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                    <span>{FACTOR_LABELS[factor as keyof typeof FACTOR_LABELS][locale]}</span>
                    <span className="tabular-nums">{Math.round(weight * 100)}%</span>
                  </li>
                ))}
              </ul>
              <p>
                {locale === "te"
                  ? "మీరు సమాధానం ఇవ్వని అంశం లెక్కల్లో చేరదు; అందుకే 'ఎన్ని అంశాల ఆధారంగా' అనే నమ్మకం శాతం చూపుతాము."
                  : "Factors you did not provide are removed from the calculation, which is why each result shows how much of the weighting it was actually based on."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "3. వివరణ ఎలా వస్తుంది" : "3. Where the explanation comes from"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted-foreground)]">
              <p>
                {locale === "te"
                  ? "వివరణలు కోడ్ నుండి — ఫ్యాక్టర్ స్కోర్ల ఆధారంగా — తయారవుతాయి. భాషా నమూనా శాతాలు లేదా కారణాలు కల్పించదు."
                  : "Explanations are generated in code from the factor scores. The language model is never asked to produce a percentage or a reason — it can only rephrase what the engine already computed."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "4. ఏఐ కౌన్సెలర్ పరిమితులు" : "4. What the AI counsellor will not do"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="warning" title={locale === "te" ? "భద్రతా నియమాలు" : "Safety rules enforced in the prompt"}>
                <ul className="list-disc space-y-1 pl-4">
                  <li>{locale === "te" ? "జీతం, ఉద్యోగం, ప్రవేశం హామీ ఇవ్వదు" : "No guaranteed salary, job, admission or outcome"}</li>
                  <li>{locale === "te" ? "మీ తుది నిర్ణయం చెప్పదు" : "Never tells the student which career to choose"}</li>
                  <li>{locale === "te" ? "మూలాలు లేకుండా సమాధానం ఇవ్వదు" : "Answers only from retrieved sources, and says so when it finds none"}</li>
                  <li>{locale === "te" ? "మార్కులు మాత్రమే చూసి నిర్ణయించదు" : "Does not decide on academic marks alone"}</li>
                </ul>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "5. డేటా మూలాలు" : "5. Data provenance"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>
                {locale === "te"
                  ? "ప్రతి సంఖ్యకు లేబుల్ ఉంటుంది: మూలం ధృవీకరించబడింది / అంచనా / ఉదాహరణ డేటా / సాధారణ మార్గదర్శనం."
                  : "Every figure carries a label: sourced, estimate, illustrative demo data, or general guidance. Demo figures are never presented as current official facts."}
              </p>
              <p>
                {locale === "te"
                  ? "నాలెడ్జ్ బేస్ పత్రాలు అధికారిక పోర్టల్‌లకు లింక్ చేయబడతాయి."
                  : "Knowledge-base documents link back to official portals (MSDE, DGT, NCVET, Skill India, Apprenticeship India, PSSCIVE)."}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href={user ? "/assessment" : "/login"} size="lg">{t("home.hero.cta")}</ButtonLink>
            <ButtonLink href="/resources" size="lg" variant="outline">
                {locale === "te" ? "వనరులు చూడండి" : "See the knowledge base"}
              </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
