"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Award,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { ROI_COMPARISON_DATA } from "@/lib/data/roi";
import { speechService } from "@/lib/utils/speech";
import type { Locale } from "@/lib/types";

interface RoiSimulatorProps {
  locale: Locale;
  onBookEscalation?: () => void;
}

export function RoiSimulator({ locale, onBookEscalation }: RoiSimulatorProps) {
  const [householdIncome, setHouseholdIncome] = useState<number>(25000);
  const [degreeCost, setDegreeCost] = useState<number>(75000);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return speechService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Comparison math
  const baExpense = degreeCost;
  const baCumulativeIncome = 0;
  const baNet = -baExpense;

  const nsqfExpense = ROI_COMPARISON_DATA.vocationalPathway.totalDirectExpense; // ₹9,000 subsidized
  const nsqfYear1 = ROI_COMPARISON_DATA.vocationalPathway.year1Stipend; // ₹1,20,000
  const nsqfYear2 = ROI_COMPARISON_DATA.vocationalPathway.year2EntrySalary; // ₹2,16,000
  const nsqfYear3 = ROI_COMPARISON_DATA.vocationalPathway.year3Salary; // ₹4,08,000
  const nsqfCumulativeIncome = nsqfYear1 + nsqfYear2 + nsqfYear3; // ₹7,44,000
  const nsqfNet = nsqfCumulativeIncome - nsqfExpense; // ₹7,35,000

  const netFamilyDifference = nsqfNet - baNet; // ~₹8,10,000 net advantage

  function handleSpeak() {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const summaryText =
        locale === "te"
          ? `3 సంవత్సరాల సాధారణ డిగ్రీ ఖర్చు మరియు సంపాదన పోలిక. సాధారణ డిగ్రీలో ఫీజులు, పుస్తకాల కోసం 75 వేల రూపాయలు ఖర్చవుతాయి మరియు 3 ఏళ్ల వరకు ఎటువంటి ఆదాయం ఉండదు. అదే సమయంలో ఎన్ఎస్ క్యూ ఎఫ్ వృత్తి కోర్సులో ప్రభుత్వం సబ్సిడీ ఇవ్వడం వల్ల ఖర్చు కేవలం 9 వేల రూపాయలు మాత్రమే. పైగా మొదటి సంవత్సరం అప్రెంటిస్ షిప్ స్టైపెండ్ తో కలిపి 3 ఏళ్లలో విద్యార్థి 7 లక్షల 44 వేల రూపాయల సంపాదన ఆర్జిస్తాడు. కుటుంబానికి 3 ఏళ్లలో 8 లక్షల రూపాయల నికర ఆర్థిక లాభం కలుగుతుంది. అదనంగా ఈపీఎఫ్ భవిష్యనిధి, ఉచిత ఈఎస్ఐ ఆరోగ్య బీమా మరియు నేరుగా పాలిటెక్నిక్ డిప్లొమా 2వ సంవత్సరంలో చేరే అవకాశం కూడా ఉంటుంది.`
          : `Financial Reality Comparison. 3 years in a general non-technical degree costs ₹75,000 in tuition and books with zero earnings. An NSQF vocational pathway costs only ₹9,000 in subsidized fees and generates ₹7,44,000 in cumulative earnings by Year 3 through apprenticeships and certified wages. This creates an ₹8.1 Lakh net advantage for your family, backed by compulsory EPF provident fund, free ESI medical protection, and NEP 2020 lateral entry into Polytechnic Diplomas.`;

      speechService.speak(summaryText, locale === "te" ? "te" : "en", () => setIsSpeaking(false));
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-700 via-orange-600 to-amber-900 p-6 text-white shadow-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
              <span>{locale === "te" ? "ఆర్థిక వాస్తవికత కాలిక్యులేటర్" : "Financial Reality & ROI Simulator"}</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {locale === "te"
                ? "3-సంవత్సరాల కాలేజీ డిగ్రీ vs వృత్తి నైపుణ్యం: ఖర్చు & సంపాదన నిజాలు"
                : "3-Year College Degree vs NSQF Vocational Pathway: Cost & Real Cash Flow"}
            </h2>
            <p className="mt-1 max-w-3xl text-xs text-amber-100 sm:text-sm">
              {locale === "te"
                ? "డిగ్రీ అప్పు మరియు నిరుద్యోగంతో పోలిస్తే, వృత్తి నైపుణ్య మార్గంలో మొదటి ఏడాది నుంచే కుటుంబ ఖాతాలోకి ఎంత సంపాదన వస్తుందో ఇక్కడ స్పష్టంగా లెక్కించండి."
                : "Compare general degree debt and unemployment against certified vocational apprenticeships, monthly wage accumulation, and statutory EPF/ESI protections."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSpeak}
            className={`flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs md:self-auto ${
              isSpeaking
                ? "bg-rose-100 text-rose-700 animate-pulse"
                : "bg-white text-slate-900 hover:bg-amber-100"
            }`}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-700" />}
            <span>
              {isSpeaking
                ? locale === "te"
                  ? "ఆపండి"
                  : "Stop audio"
                : locale === "te"
                  ? "వాయిస్‌లో మొత్తం సారాంశం వినండి"
                  : "Listen aloud in regional voice"}
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Sliders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "te" ? "మీ కుటుంబ వివరాలు ఎంచుకోండి" : "Adjust your household financial assumptions"}
          </CardTitle>
          <CardDescription>
            {locale === "te"
              ? "మీ ప్రస్తుత ఆదాయం మరియు కాలేజీ ఫీజులను మార్చి తేడాను గమనించండి."
              : "Adjust your monthly income and degree tuition assumptions to recalculate the 3-year cash flow."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
              <label className="font-semibold text-[var(--foreground)]" htmlFor="roi-income">
                {locale === "te" ? "కుటుంబ నెలవారీ ఆదాయం:" : "Monthly household income:"}
              </label>
              <span className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 font-bold text-amber-800 tabular-nums">
                ₹{householdIncome.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              id="roi-income"
              type="range"
              min={10000}
              max={75000}
              step={5000}
              value={householdIncome}
              onChange={(e) => setHouseholdIncome(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] text-[var(--muted-foreground)]">
              <span>₹10,000</span>
              <span>₹40,000</span>
              <span>₹75,000</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
              <label className="font-semibold text-[var(--foreground)]" htmlFor="roi-college">
                {locale === "te" ? "కాలేజీ డిగ్రీ అంచనా ఖర్చు (3 ఏళ్లు):" : "3-year general degree tuition + books:"}
              </label>
              <span className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 font-bold text-rose-800 tabular-nums">
                ₹{degreeCost.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              id="roi-college"
              type="range"
              min={30000}
              max={150000}
              step={5000}
              value={degreeCost}
              onChange={(e) => setDegreeCost(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[11px] text-[var(--muted-foreground)]">
              <span>₹30,000 (Govt college)</span>
              <span>₹75,000 (Average)</span>
              <span>₹1,50,000 (Private)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Advantage Callout Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-md md:flex-row md:items-center">
        <div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100">
            {locale === "te" ? "3-సంవత్సరాల కుటుంబ నికర ఆర్థిక లాభం" : "3-Year Cumulative Family Net Advantage"}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums sm:text-4xl">
              +₹{netFamilyDifference.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-emerald-100 sm:text-sm">
              {locale === "te" ? "కుటుంబ బ్యాంక్ ఖాతాలో నికర మిగులు" : "net surplus in family account"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-xs text-emerald-100 sm:text-sm">
            {locale === "te"
              ? "డిగ్రీ చేసిన విద్యార్థి 3 ఏళ్ల తర్వాత సున్నా అనుభవంతో ఉద్యోగ వేటలో ఉంటే, వృత్తి కోర్సు చేసిన విద్యార్థి ఇప్పటికే ₹7.44 లక్షలు సంపాదించి, 3 ఏళ్ల కార్పొరేట్ అనుభవం కలిగి ఉంటాడు."
              : "While a general degree graduate graduates with zero work experience and debt, an NSQF certified technician already has 3 years of verified industry experience and formal savings."}
          </p>
        </div>

        {onBookEscalation ? (
          <Button
            onClick={onBookEscalation}
            className="self-start bg-white text-emerald-900 hover:bg-emerald-50 md:self-auto font-bold"
          >
            {locale === "te" ? "ఐటీఐ అధికారిని సంప్రదించండి" : "Speak to ITI Nodal Officer"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* General Degree Card */}
        <Card className="border-rose-200">
          <CardHeader className="bg-rose-50/50 pb-4">
            <Badge variant="outline" className="w-fit border-rose-300 text-rose-700">
              {locale === "te" ? "సాంప్రదాయ కాలేజీ డిగ్రీ" : "General Non-Technical Degree (B.A. / B.Com)"}
            </Badge>
            <CardTitle className="text-xl text-rose-950">
              {locale === "te" ? "సాధారణ కాలేజీ డిగ్రీ మార్గం" : "Traditional College Pathway"}
            </CardTitle>
            <CardDescription>
              {locale === "te"
                ? "3 సంవత్సరాలు నిరంతర కుటుంబ ఖర్చు మరియు సున్నా సంపాదన"
                : "3 years of continuous family outflow with zero cash flow"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "ఫీజులు & ఖర్చులు:" : "3-year direct cost:"}</span>
              <span className="font-bold text-rose-600 tabular-nums">-₹{baExpense.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "1వ సంవత్సరం సంపాదన:" : "Year 1 earnings:"}</span>
              <span className="tabular-nums">₹0</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "2వ సంవత్సరం సంపాదన:" : "Year 2 earnings:"}</span>
              <span className="tabular-nums">₹0</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "3వ సంవత్సరం సంపాదన:" : "Year 3 earnings:"}</span>
              <span className="tabular-nums">₹0</span>
            </div>
            <div className="flex justify-between border-b pb-2 font-semibold">
              <span>{locale === "te" ? "3-ఏళ్ల మొత్తం సంపాదన:" : "3-year cumulative earnings:"}</span>
              <span className="text-rose-600 tabular-nums">₹0</span>
            </div>
            <div className="flex justify-between rounded-lg bg-rose-50 p-3 font-bold text-rose-900">
              <span>{locale === "te" ? "3 ఏళ్ల తర్వాత నికర స్థితి:" : "Net 3-year family position:"}</span>
              <span className="tabular-nums">-₹{baExpense.toLocaleString("en-IN")}</span>
            </div>
            <div className="space-y-1.5 pt-2 text-xs text-[var(--muted-foreground)]">
              <p className="flex items-center gap-1.5 text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {locale === "te"
                    ? "నిరుద్యోగిత రిస్క్: కేవలం 34.2% మందికి మాత్రమే క్యాంపస్ ఉద్యోగాలు లభిస్తాయి."
                    : "High risk: Verified campus placement rate is only 34.2%."}
                </span>
              </p>
              <p>
                {locale === "te"
                  ? "డిగ్రీ తర్వాత ప్రారంభ జీతం సగటున ₹11,000/నెల మాత్రమే."
                  : "Average starting salary after general degree is ₹11,000/month without technical credentials."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NSQF Vocational Pathway Card */}
        <Card className="border-emerald-300 ring-2 ring-emerald-500/20">
          <CardHeader className="bg-emerald-50/50 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="success">
                {locale === "te" ? "ప్రభుత్వ గుర్తింపు పొందిన మార్గం" : "NSQF Vocational Certification (ITI / PMKK)"}
              </Badge>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-xl text-emerald-950">
              {locale === "te" ? "వృత్తి నైపుణ్య & అప్రెంటిస్‌షిప్ మార్గం" : "Vocational + Apprenticeship Pathway"}
            </CardTitle>
            <CardDescription>
              {locale === "te"
                ? "మొదటి ఏడాది నుంచే అప్రెంటిస్ స్టైపెండ్ మరియు పక్కా కార్పొరేట్ ఉద్యోగం"
                : "Stipend from Year 1, certified wages, and full corporate social security"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "ఫీజులు & సాధనాలు (సబ్సిడీ):" : "3-year direct cost (Govt subsidized):"}</span>
              <span className="font-bold text-slate-700 tabular-nums">-₹{nsqfExpense.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "1వ ఏడాది అప్రెంటిస్ స్టైపెండ్:" : "Year 1 apprenticeship stipend:"}</span>
              <span className="font-bold text-emerald-600 tabular-nums">+₹{nsqfYear1.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "2వ ఏడాది ప్రారంభ జీతం:" : "Year 2 entry technician wage:"}</span>
              <span className="font-bold text-emerald-600 tabular-nums">+₹{nsqfYear2.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-[var(--muted-foreground)]">{locale === "te" ? "3వ ఏడాది సీనియర్ టెక్నీషియన్ జీతం:" : "Year 3 senior technician wage:"}</span>
              <span className="font-bold text-emerald-600 tabular-nums">+₹{nsqfYear3.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-b pb-2 font-semibold">
              <span>{locale === "te" ? "3-ఏళ్ల మొత్తం సంపాదన:" : "3-year cumulative earnings:"}</span>
              <span className="font-bold text-emerald-700 tabular-nums">+₹{nsqfCumulativeIncome.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-emerald-100 p-3 font-bold text-emerald-950">
              <span>{locale === "te" ? "3 ఏళ్ల తర్వాత నికర స్థితి:" : "Net 3-year family position:"}</span>
              <span className="tabular-nums">+₹{nsqfNet.toLocaleString("en-IN")}</span>
            </div>
            <div className="space-y-1.5 pt-2 text-xs text-emerald-800">
              <p className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  {locale === "te"
                    ? "88.5% ధృవీకరించబడిన ప్లేస్‌మెంట్ రేటు టాటా, అమర రాజా, ష్నైడర్ వంటి టాప్ కంపెనీలలో."
                    : "88.5% verified placement rate with major corporate partners."}
                </span>
              </p>
              <p className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  {locale === "te"
                    ? "ఈపీఎఫ్ ప్రావిడెంట్ ఫండ్ లో ₹89,000+ అదనపు పొదుపు మరియు కుటుంబానికి ఈఎస్ఐ ఉచిత వైద్యం."
                    : "₹89,000+ accumulated EPF provident fund plus 100% ESI health cover."}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statutory Protections & Educational Bridges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <span>
              {locale === "te"
                ? "చట్టపరమైన రక్షణలు & ఉన్నత విద్య వంతెన (NEP 2020)"
                : "Statutory Protections & NEP 2020 Educational Progression"}
            </span>
          </CardTitle>
          <CardDescription>
            {locale === "te"
              ? "వృత్తి విద్యా కోర్సులు విద్యార్థి భవిష్యత్తుకు పూర్తి రక్షణ మరియు మరింత ఎదిగే అవకాశాలను ఇస్తాయి."
              : "Why vocational qualifications are formal, legally protected career pathways that never dead-end."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="font-bold text-[var(--foreground)]">
              {locale === "te" ? "ఈపీఎఫ్ & ఈఎస్ఐ చట్టం" : "Compulsory EPF & ESI Cover"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {locale === "te"
                ? "12% కంపెనీ + 12% ఉద్యోగి ప్రావిడెంట్ ఫండ్ పింఛను భద్రత మరియు కుటుంబం మొత్తానికి ఉచిత ఆసుపత్రి చికిత్స."
                : "12% employee + 12% employer PF retirement deposit plus full cashless family health hospital care under statutory law."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <GraduationCap className="h-5 w-5" />
            </div>
            <p className="font-bold text-[var(--foreground)]">
              {locale === "te" ? "లాటరల్ పాలిటెక్నిక్ ఎంట్రీ" : "Lateral Diploma & Degree Entry"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {locale === "te"
                ? "ఎన్ఈపీ 2020 ప్రకారం NSQF లెవల్ 4 పాసైన వారు నేరుగా పాలిటెక్నిక్ డిప్లొమా 2వ సంవత్సరంలో చేరవచ్చు."
                : "Under NEP 2020, certified candidates enter 2nd year of Polytechnic Diploma directly and progress to B.Voc degrees."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Award className="h-5 w-5" />
            </div>
            <p className="font-bold text-[var(--foreground)]">
              {locale === "te" ? "ప్రభుత్వ ఉద్యోగ అర్హత" : "Govt Competitive Exams"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {locale === "te"
                ? "రైల్వేలు (RRB ALP), ఆర్మీ, విద్యుత్ బోర్డులు (APTransco/Discoms) మరియు పోలీస్ టెక్నికల్ ఉద్యోగాలకు 100% అర్హత."
                : "100% recognized for Railway Assistant Loco Pilot (ALP), Defence Corps, State Electricity Boards, and SSC exams."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
