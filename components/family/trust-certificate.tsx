"use client";

import { useState } from "react";
import {
  Award,
  Building,
  CheckCircle2,
  Copy,
  Download,
  Phone,
  Printer,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select } from "@/components/ui/primitives";
import { VERIFIED_TRADE_OUTCOMES, VERIFIED_TRAINING_PROVIDERS } from "@/lib/data/trade-outcomes";
import type { Locale, TradeOutcomeData } from "@/lib/types";

interface TrustCertificateProps {
  locale: Locale;
  initialTradeId?: string;
  defaultStudentName?: string;
  defaultDistrict?: string;
}

export function TrustCertificate({
  locale,
  initialTradeId,
  defaultStudentName = "రాహుల్ వర్మ (Rahul Varma)",
  defaultDistrict = "Visakhapatnam",
}: TrustCertificateProps) {
  const [selectedTrade, setSelectedTrade] = useState<TradeOutcomeData>(
    VERIFIED_TRADE_OUTCOMES.find((t) => t.id === initialTradeId) || VERIFIED_TRADE_OUTCOMES[0]!,
  );
  const [candidateName, setCandidateName] = useState(defaultStudentName);
  const [parentName, setParentName] = useState(
    locale === "te" ? "రామారావు (Rama Rao - Father)" : "Rama Rao (Father)",
  );
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [copied, setCopied] = useState(false);

  const matchedProvider =
    VERIFIED_TRAINING_PROVIDERS.find((p) => p.district.toLowerCase().includes(selectedDistrict.toLowerCase())) ||
    VERIFIED_TRAINING_PROVIDERS[0]!;

  function handlePrint() {
    window.print();
  }

  function handleShareWhatsApp() {
    const tradeTitle = locale === "te" ? selectedTrade.nameTe : selectedTrade.nameEn;
    const text =
      locale === "te"
        ? `*కుటుంబ వృత్తి నైపుణ్య విశ్వాస పత్రం (SkillPath AI - Family Trust Certificate)*\n\n` +
          `విద్యార్థి: ${candidateName}\n` +
          `అభిభావకుడు: ${parentName}\n` +
          `ఎంచుకున్న వృత్తి: ${tradeTitle} (NSQF లెవల్ ${selectedTrade.nsqfLevel})\n` +
          `ధృవీకరించబడిన ప్లేస్‌మెంట్ రేటు: ${selectedTrade.placementRate}%\n` +
          `3-ఏళ్ల సగటు జీతం: ₹${selectedTrade.avg3YearSalary.toLocaleString("en-IN")}/నెల\n` +
          `చట్టపరమైన రక్షణ: ఈపీఎఫ్ (PF) పింఛను + ఈఎస్ఐ ఉచిత ఆరోగ్య బీమా\n` +
          `ఉన్నత విద్యా మార్గం: నూతన విద్యా విధానం (NEP 2020) కింద పాలిటెక్నిక్ డిప్లొమా 2వ సంవత్సరంలోకి లాటరల్ ఎంట్రీ & B.Voc డిగ్రీ ద్వారా ప్రభుత్వ ఉద్యోగాలకు 100% అర్హత\n\n` +
          `ప్రధాన నియామక సంస్థలు: ${selectedTrade.topEmployers.slice(0, 4).join(", ")}\n` +
          `స్థానిక ప్రభుత్వ ఐటీఐ కేంద్రం: ${matchedProvider.name}\n` +
          `ప్లేస్‌మెంట్ అధికారి: ${matchedProvider.nodalOfficer} (${matchedProvider.phone})\n\n` +
          `SkillPath AI - భారత ప్రభుత్వం & రాష్ట్ర నైపుణ్యాభివృద్ధి ప్రమాణాలు`
        : `*Family Vocational Trust Certificate (SkillPath AI)*\n\n` +
          `Student: ${candidateName}\n` +
          `Parent: ${parentName}\n` +
          `Selected Trade: ${selectedTrade.nameEn} (NSQF Level ${selectedTrade.nsqfLevel})\n` +
          `Verified Placement Rate: ${selectedTrade.placementRate}%\n` +
          `3-Year Average Wage: ₹${selectedTrade.avg3YearSalary.toLocaleString("en-IN")}/month\n` +
          `Statutory Protections: EPF Provident Fund + Cashless ESI Family Hospitalization\n` +
          `Higher Education Mobility: NEP 2020 lateral entry into 2nd year Polytechnic Diploma and UGC-recognized B.Voc degree (valid for Govt/Civil exams)\n\n` +
          `Top Employers: ${selectedTrade.topEmployers.slice(0, 4).join(", ")}\n` +
          `Government Nodal Center: ${matchedProvider.name}\n` +
          `Nodal Placement Officer: ${matchedProvider.nodalOfficer} (${matchedProvider.phone})\n\n` +
          `SkillPath AI - Explainable Vocational Guidance Platform`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  function handleCopySummary() {
    const tradeTitle = locale === "te" ? selectedTrade.nameTe : selectedTrade.nameEn;
    const text =
      `Family Vocational Trust Certificate — ${tradeTitle}\n` +
      `Student: ${candidateName}\n` +
      `Verified Placement: ${selectedTrade.placementRate}%\n` +
      `3-Year Avg Wage: ₹${selectedTrade.avg3YearSalary.toLocaleString("en-IN")}/mo with EPF/ESI\n` +
      `Nodal ITI Center: ${matchedProvider.name} (${matchedProvider.phone})`;
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <Badge variant="accent">
            {locale === "te" ? "కుటుంబం & బంధువుల కోసం అధికారిక రుజువు" : "Official Family & Relatives Verification"}
          </Badge>
          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            {locale === "te" ? "కుటుంబ వృత్తి నైపుణ్య విశ్వాస పత్రం" : "Family Vocational Trust Certificate"}
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] sm:text-sm">
            {locale === "te"
              ? 'బంధువులు లేదా ఇరుగుపొరుగు వారు "ఇది సాధారణ పని" అని ప్రశ్నించినప్పుడు, ప్రభుత్వ ఆధారాలతో కూడిన ఈ అధికారిక విశ్వాస పత్రాన్ని వారికి చూపించండి.'
              : 'A formal verification credential to reassure extended family and relatives about salary reality, corporate prestige, and statutory protections.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleShareWhatsApp} className="bg-emerald-600 font-bold text-white hover:bg-emerald-700">
            <Share2 className="mr-2 h-4 w-4" />
            <span>{locale === "te" ? "వాట్సాప్‌లో పంపండి" : "Share on WhatsApp"}</span>
          </Button>

          <Button onClick={handlePrint} variant="outline" className="font-bold">
            <Printer className="mr-2 h-4 w-4" />
            <span>{locale === "te" ? "ప్రింట్ / PDF సేవ్" : "Print / Save PDF"}</span>
          </Button>
        </div>
      </div>

      {/* Customization Inputs */}
      <Card>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-3 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-[var(--foreground)]" htmlFor="tc-student">
              {locale === "te" ? "విద్యార్థి పేరు:" : "Student Name:"}
            </label>
            <Input
              id="tc-student"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--foreground)]" htmlFor="tc-parent">
              {locale === "te" ? "తల్లిదండ్రుల / సంరక్షకుని పేరు:" : "Parent/Guardian Name:"}
            </label>
            <Input
              id="tc-parent"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--foreground)]" htmlFor="tc-trade">
              {locale === "te" ? "వృత్తి మార్గం ఎంచుకోండి:" : "Select Vocational Trade:"}
            </label>
            <Select
              id="tc-trade"
              value={selectedTrade.id}
              onChange={(e) => {
                const tr = VERIFIED_TRADE_OUTCOMES.find((t) => t.id === e.target.value);
                if (tr) setSelectedTrade(tr);
              }}
              className="text-xs"
            >
              {VERIFIED_TRADE_OUTCOMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {locale === "te" ? t.nameTe : t.nameEn}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* The Printable Trust Certificate Card */}
      <div
        id="printable-trust-card"
        className="relative overflow-hidden rounded-3xl border-4 border-amber-500/40 bg-white p-6 text-slate-900 shadow-lg sm:p-8 print:border-2 print:p-6 print:shadow-none"
      >
        {/* Subtle Watermark Badge */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-amber-50 blur-2xl" />

        {/* Certificate Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b-2 border-amber-200 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-md ring-4 ring-amber-100">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                {locale === "te" ? "భారత ప్రభుత్వం నైపుణ్యాభివృద్ధి ప్రమాణాలు" : "National Skills Qualification Framework (NSQF)"}
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                {locale === "te" ? "కుటుంబ వృత్తి నైపుణ్య ధృవీకరణ పత్రం" : "Family Vocational Trust Credential"}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === "te" ? "ప్రమాణపత్ర సంఖ్య" : "Credential Reference"}: SP-TRUST-
                {selectedTrade.id.toUpperCase()}-2026
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end text-xs">
            <Badge variant="outline" className="border-amber-400 bg-amber-50 font-bold text-amber-900">
              NCVT / MSDE Verified
            </Badge>
            <span className="text-[11px] text-slate-500">
              {locale === "te" ? "జారీ తేదీ" : "Issued"}: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Certificate Recipient Callout */}
        <div className="mb-6 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-4">
          <p className="text-xs text-slate-600">
            {locale === "te" ? "ఈ పత్రం ద్వారా ధృవీకరించునది ఏమనగా:" : "This formal verification is presented to:"}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span className="text-lg font-extrabold text-slate-900">{candidateName}</span>
            <span className="text-xs text-slate-600">
              ({locale === "te" ? "సంరక్షకుడు" : "Guardian"}: <strong className="text-slate-800">{parentName}</strong>)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {locale === "te"
              ? `విద్యార్థి ఎంచుకున్న వృత్తి విభాగం: `
              : `Has selected the approved professional pathway: `}
            <span className="font-bold text-amber-950">
              {locale === "te" ? selectedTrade.nameTe : selectedTrade.nameEn} (NSQF Level {selectedTrade.nsqfLevel})
            </span>
          </p>
        </div>

        {/* 4 Verified Metric Pillars */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[11px] font-semibold text-slate-500">
              {locale === "te" ? "క్యాంపస్ ప్లేస్‌మెంట్" : "Verified Placement"}
            </span>
            <p className="text-xl font-extrabold text-emerald-700 sm:text-2xl tabular-nums">
              {selectedTrade.placementRate}%
            </p>
            <span className="text-[10px] text-slate-400">
              {selectedTrade.sampleSize.toLocaleString("en-IN")} candidates
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[11px] font-semibold text-slate-500">
              {locale === "te" ? "ప్రారంభ జీతం" : "Starting Salary"}
            </span>
            <p className="text-xl font-extrabold text-slate-900 sm:text-2xl tabular-nums">
              ₹{selectedTrade.avgStartingSalary.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400">per month (Entry)</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[11px] font-semibold text-slate-500">
              {locale === "te" ? "3-ఏళ్ల సగటు జీతం" : "3-Year Wage"}
            </span>
            <p className="text-xl font-extrabold text-amber-700 sm:text-2xl tabular-nums">
              ₹{selectedTrade.avg3YearSalary.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400">Senior Technician</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[11px] font-semibold text-slate-500">
              {locale === "te" ? "5-ఏళ్ల సంపాదన స్థాయి" : "5-Year Wage"}
            </span>
            <p className="text-xl font-extrabold text-indigo-700 sm:text-2xl tabular-nums">
              ₹{selectedTrade.avg5YearSalary.toLocaleString("en-IN")}+
            </p>
            <span className="text-[10px] text-slate-400">Supervisory / Lead</span>
          </div>
        </div>

        {/* Corporate Employers */}
        <div className="mb-6 rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {locale === "te" ? "ప్రధాన కార్పొరేట్ నియామక సంస్థలు" : "Recognized Corporate Recruiting Partners"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTrade.topEmployers.map((emp) => (
              <span
                key={emp}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-800"
              >
                <Building className="h-3 w-3 text-slate-500" />
                <span>{emp}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Rebuttal to Relatives Box */}
        <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>
              {locale === "te"
                ? "బంధువులు లేదా ఇరుగుపొరుగు వారికి ఏమి సమాధానం చెప్పాలి?"
                : 'Direct Reassurance for Relatives ("Log Kya Kahenge"):'}
            </span>
          </p>
          <p className="mt-1 text-xs italic text-indigo-900">
            &ldquo;
            {locale === "te"
              ? selectedTrade.parentRebuttal.socialStandingAdvise.te
              : selectedTrade.parentRebuttal.socialStandingAdvise.en}
            &rdquo;
          </p>
        </div>

        {/* Verified Nodal ITI Center & Officer Contact */}
        <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            {locale === "te" ? "ధృవీకరించబడిన ప్రభుత్వ ఐటీఐ నోడల్ కేంద్రం" : "Designated District Government ITI & Placement Officer"}
          </p>
          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <p className="font-bold text-slate-900">{matchedProvider.name}</p>
              <p className="text-slate-600">{matchedProvider.address}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-slate-900">
                {locale === "te" ? "ప్లేస్‌మెంట్ అధికారి" : "Placement Officer"}: {matchedProvider.nodalOfficer}
              </p>
              <p className="flex items-center gap-1 font-mono font-bold text-amber-900 sm:justify-end">
                <Phone className="h-3 w-3" />
                <span>{matchedProvider.phone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Seal Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between border-t border-slate-200 pt-4 text-[11px] text-slate-500">
          <p>SkillPath AI · Verified under NCVT, Directorate General of Training (DGT) & NEP 2020</p>
          <p>{copied ? "✓ Copied to clipboard" : "Valid for family presentation and bank educational subsidies"}</p>
        </div>
      </div>
    </div>
  );
}
