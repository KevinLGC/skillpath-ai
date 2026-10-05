"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Info,
  Loader2,
  PhoneCall,
  Send,
  Sparkles,
  User as UserIcon,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, Input } from "@/components/ui/primitives";
import { Disclaimer, SourceList } from "@/components/ui/misc";
import type { AnswerSource, GroundingLevel, Locale, ParentalObjectionType, PerspectiveMode } from "@/lib/types";
import { speechService } from "@/lib/utils/speech";
import { cn } from "@/lib/utils/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  grounding?: GroundingLevel | null;
  sources?: AnswerSource[];
  mode?: "llm" | "retrieval" | null;
  uncertainty?: string | null;
}

const GROUNDING_COPY: Record<GroundingLevel, { en: string; te: string; variant: "success" | "warning" | "accent" | "muted" }> = {
  sourced: { en: "From sources", te: "మూలాల నుండి", variant: "success" },
  estimated: { en: "Contains estimates", te: "అంచనాలు ఉన్నాయి", variant: "warning" },
  guidance: { en: "General guidance", te: "సాధారణ మార్గదర్శనం", variant: "accent" },
  uncertain: { en: "Not in sources", te: "మూలాలలో లేదు", variant: "muted" },
};

const OBJECTION_CHIPS: { id: ParentalObjectionType; label: { en: string; te: string }; query: { en: string; te: string } }[] = [
  {
    id: "social_status",
    label: { en: "Log Kya Kahenge (Stigma)", te: "సమాజంలో గౌరవం (హోదా)" },
    query: {
      en: "Does vocational ITI get genuine social respect? Will relatives look down on this compared to a degree?",
      te: "ఐటిఐ లేదా ఒకేషనల్ చదివితే బంధువులు, సమాజంలో గౌరవం ఉంటుందా? 'మిస్త్రీ' అని అంటారా?",
    },
  },
  {
    id: "degree_fixation",
    label: { en: "Degree vs ITI ROI", te: "డిగ్రీ vs ఐటిఐ ఖర్చు" },
    query: {
      en: "How does an NSQF ITI compare financially to a regular 3-year BA/BCom degree in terms of debt and earnings?",
      te: "సాధారణ బి.ఎ/బి.కాం డిగ్రీ కంటే ఐటిఐ చదివితే 3 సంవత్సరాలలో ఖర్చు మరియు సంపాదన ఎలా ఉంటుంది?",
    },
  },
  {
    id: "earning_potential",
    label: { en: "Salary & Growth", te: "జీతం మరియు వృద్ధి" },
    query: {
      en: "What is the real starting salary, apprenticeship stipend, and 3-5 year earning progression for ITI graduates?",
      te: "ఐటిఐ పూర్తయిన తర్వాత ప్రారంభ వేతనం, అప్రెంటిస్‌షిప్ స్టైపెండ్ మరియు 3-5 సంవత్సరాల తర్వాత ఎంత వస్తుంది?",
    },
  },
  {
    id: "female_safety",
    label: { en: "Women Safety in Trades", te: "మహిళలకు భద్రత" },
    query: {
      en: "Are workshop and industrial trades safe and suitable for women? What are the job protections and quotas?",
      te: "వర్క్‌షాప్‌లు మరియు పారిశ్రామిక శిక్షణ అమ్మాయిలకు సురక్షితమేనా? వారికి ఎలాంటి ఉద్యోగ అవకాశాలు ఉన్నాయి?",
    },
  },
];

export function CounsellorChat({
  locale,
  roleContext,
  suggestedQuestions,
}: {
  locale: Locale;
  roleContext: "student" | "family" | "counsellor";
  suggestedQuestions: string[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perspectiveMode, setPerspectiveMode] = useState<PerspectiveMode>(
    roleContext === "student" ? "learner" : "joint"
  );
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalatedSuccess, setEscalatedSuccess] = useState(false);
  const [escalationForm, setEscalationForm] = useState({
    parentName: "",
    studentName: "",
    phone: "",
    district: "Visakhapatnam",
    primaryObjection: "social_status" as ParentalObjectionType,
    preferredTrade: "Electrician",
  });
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  function handleToggleSpeech(index: number, text: string) {
    if (speakingIndex === index) {
      speechService.stop();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      speechService.speak(text, locale === "te" ? "te" : "en", () => {
        setSpeakingIndex(null);
      });
    }
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 3 || busy) return;
    setBusy(true);
    setError(null);
    setMessages((previous) => [...previous, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, roleContext, perspectiveMode, sessionId }),
      });

      const body = (await response.json()) as {
        error?: string;
        detail?: string;
        sessionId?: string;
        answer?: string;
        grounding?: GroundingLevel;
        sources?: AnswerSource[];
        uncertainty?: string | null;
        mode?: "llm" | "retrieval";
        suggestEscalation?: boolean;
        detectedObjection?: ParentalObjectionType;
      };

      if (!response.ok) {
        setError(body.detail ?? body.error ?? "The counsellor is unavailable right now.");
        setBusy(false);
        return;
      }

      if (body.sessionId) setSessionId(body.sessionId);
      if (body.suggestEscalation) {
        setShowEscalation(true);
        if (body.detectedObjection) {
          setEscalationForm((prev) => ({ ...prev, primaryObjection: body.detectedObjection as ParentalObjectionType }));
        }
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: body.answer ?? "",
          grounding: body.grounding ?? "guidance",
          sources: body.sources ?? [],
          mode: body.mode ?? "retrieval",
          uncertainty: body.uncertainty ?? null,
        },
      ]);
    } catch {
      setError("Network problem — the rest of the platform still works, and your plan is unchanged.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  async function handleEscalateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!escalationForm.phone || escalationForm.phone.length < 10) return;
    setEscalating(true);
    try {
      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...escalationForm,
          notes: `Escalated from Counsellor Chat. Mode: ${perspectiveMode}`,
        }),
      });
      if (res.ok) {
        setEscalatedSuccess(true);
        setTimeout(() => {
          setShowEscalation(false);
          setEscalatedSuccess(false);
        }, 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEscalating(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card className="flex min-h-[560px] flex-col">
        {/* Perspective Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--secondary)]/30 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
            <span className="text-[var(--muted-foreground)]">{locale === "te" ? "కౌన్సెలింగ్ మోడ్:" : "Perspective Mode:"}</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5">
            <button
              type="button"
              onClick={() => setPerspectiveMode("joint")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                perspectiveMode === "joint"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              {locale === "te" ? "ఉమ్మడి కుటుంబం" : "Joint Family"}
            </button>
            <button
              type="button"
              onClick={() => setPerspectiveMode("parent")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                perspectiveMode === "parent"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {locale === "te" ? "తల్లిదండ్రుల దృక్కోణం" : "Parent View"}
            </button>
            <button
              type="button"
              onClick={() => setPerspectiveMode("learner")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                perspectiveMode === "learner"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {locale === "te" ? "విద్యార్థి ఆశయాలు" : "Learner View"}
            </button>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 pt-4">
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                    <Sparkles className="h-4 w-4 text-[var(--primary)]" aria-hidden />
                    {locale === "te" ? "సందేహాన్ని నివృత్తి చేసుకోండి" : "Address Family Concerns & Career Queries"}
                  </p>
                  <Badge variant="accent">
                    {perspectiveMode === "joint"
                      ? (locale === "te" ? "కుటుంబ అవగాహన" : "Family Consensus")
                      : perspectiveMode === "parent"
                      ? (locale === "te" ? "భద్రత & గౌరవం" : "Financial & Status Focus")
                      : (locale === "te" ? "నైపుణ్యాలు & భవిష్యత్తు" : "Tech & Ambition")}
                  </Badge>
                </div>
                <p>
                  {locale === "te"
                    ? "NSQF మరియు NCVT అధికారిక నిబంధనల ఆధారంగా ఖచ్చితమైన సమాచారం లభిస్తుంది. కింద ఇచ్చిన తల్లిదండ్రుల సందేహాల బటన్లను క్లిక్ చేసి వెంటనే తెలుసుకోవచ్చు."
                    : "Answers are grounded in NSQF, NCVT, and district-level placement records. Select any family doubt chip below or type your custom query."}
                </p>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                {message.role === "assistant" ? (
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent)]">
                    <Bot className="h-4 w-4" aria-hidden />
                  </span>
                ) : null}
                <div className={cn("max-w-[85%] space-y-2 rounded-xl border p-3 text-sm", message.role === "user" ? "bg-[var(--secondary)]" : "border-[var(--border)]")}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {message.grounding ? (
                            <Badge variant={GROUNDING_COPY[message.grounding].variant}>
                              {GROUNDING_COPY[message.grounding][locale]}
                            </Badge>
                          ) : null}
                          {message.mode === "retrieval" ? (
                            <Badge variant="outline">
                              {locale === "te" ? "మూలాల నుండి" : "retrieval"}
                            </Badge>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(index, message.content)}
                          className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                          title={speakingIndex === index ? (locale === "te" ? "ఆపండి" : "Stop speaking") : (locale === "te" ? "వినండి" : "Listen aloud")}
                        >
                          {speakingIndex === index ? (
                            <>
                              <VolumeX className="h-3 w-3 text-red-500 animate-pulse" />
                              <span>{locale === "te" ? "ఆపండి" : "Stop"}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3" />
                              <span>{locale === "te" ? "వినండి" : "Listen"}</span>
                            </>
                          )}
                        </button>
                      </div>
                      {message.uncertainty ? (
                        <p className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                          <Info className="mt-0.5 h-3 w-3" aria-hidden />
                          {message.uncertainty}
                        </p>
                      ) : null}
                      <SourceList sources={message.sources ?? []} locale={locale} />
                    </>
                  ) : (
                    <span className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <UserIcon className="h-3 w-3" aria-hidden />
                      {locale === "te" ? "మీరు" : "You"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {busy ? (
              <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {locale === "te" ? "నాలెడ్జ్ బేస్ చూస్తున్నాను…" : "Checking the knowledge base…"}
              </p>
            ) : null}
          </div>

          {/* Human Escalation Alert */}
          {showEscalation ? (
            <div className="relative rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3.5 text-sm">
              <button
                type="button"
                onClick={() => setShowEscalation(false)}
                className="absolute right-2.5 top-2.5 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                  <PhoneCall className="h-4 w-4" />
                </span>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-[var(--foreground)]">
                    {locale === "te"
                      ? "ప్రభుత్వ ఐటిఐ నోడల్ అధికారితో ప్రత్యక్ష సంభాషణ"
                      : "Connect with District ITI Nodal Officer"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {locale === "te"
                      ? "కుటుంబంలో ఇంకా సందేహాలు లేదా ఆందోళనలు ఉన్నాయా? సమీప ప్రభుత్వ ఐటిఐ కౌన్సెలర్ లేదా ప్లేస్‌మెంట్ ఆఫీసర్‌తో ఉచిత కౌన్సెలింగ్ కాల్ పొందండి."
                      : "Have unresolved concerns about social stigma or earning? Request a direct free callback from your local Government ITI Nodal Officer."}
                  </p>

                  {escalatedSuccess ? (
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      {locale === "te"
                        ? "అభ్యర్థన నమోదు చేయబడింది! 24 గంటల్లో అధికారి సంప్రదిస్తారు."
                        : "Escalation request submitted! A counsellor will call you within 24 hours."}
                    </div>
                  ) : (
                    <form onSubmit={handleEscalateSubmit} className="mt-2.5 grid gap-2 sm:grid-cols-3">
                      <Input
                        placeholder={locale === "te" ? "తల్లిదండ్రుల పేరు" : "Parent Name"}
                        value={escalationForm.parentName}
                        onChange={(e) => setEscalationForm((p) => ({ ...p, parentName: e.target.value }))}
                        className="h-8 text-xs"
                        required
                      />
                      <Input
                        placeholder={locale === "te" ? "ఫోన్ నంబర్" : "Phone Number"}
                        type="tel"
                        value={escalationForm.phone}
                        onChange={(e) => setEscalationForm((p) => ({ ...p, phone: e.target.value }))}
                        className="h-8 text-xs"
                        required
                      />
                      <Button type="submit" size="sm" disabled={escalating}>
                        {escalating ? <Loader2 className="h-3 w-3 animate-spin" /> : <PhoneCall className="h-3 w-3" />}
                        {locale === "te" ? "కాల్ పొందండి" : "Request Call"}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <Alert variant="warning" title={locale === "te" ? "సమస్య" : "Something interrupted that"}>
              <p>{error}</p>
            </Alert>
          ) : null}

          {/* Quick Family Objection Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            <span className="shrink-0 text-[11px] font-semibold text-[var(--muted-foreground)]">
              {locale === "te" ? "సందేహాలు:" : "Family Doubts:"}
            </span>
            {OBJECTION_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => void ask(chip.query[locale])}
                disabled={busy}
                className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--accent)]"
              >
                {chip.label[locale]}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-[var(--border)] pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
          >
            <label className="sr-only" htmlFor="chat-input">
              {locale === "te" ? "ప్రశ్న" : "Question"}
            </label>
            <Input
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                perspectiveMode === "parent"
                  ? locale === "te"
                    ? "తల్లిదండ్రుల ప్రశ్న (జీతం, భద్రత, ఉద్యోగ స్థిరత్వం)…"
                    : "Ask as a parent (salary, security, stigma)…"
                  : perspectiveMode === "learner"
                  ? locale === "te"
                    ? "విద్యార్థి ప్రశ్న (ట్రేడ్ నైపుణ్యాలు, కంప్యూటర్లు, ప్రమోషన్లు)…"
                    : "Ask as a learner (skills, equipment, startups)…"
                  : locale === "te"
                  ? "కుటుంబ ప్రశ్నను అడగండి…"
                  : "Ask a family or career question…"
              }
              disabled={busy}
            />
            <Button type="submit" disabled={busy || input.trim().length < 3}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {locale === "te" ? "అడగండి" : "Ask"}
            </Button>
          </form>
          <Disclaimer locale={locale} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Quick Tools Card */}
        <Card className="border-[var(--primary)]/20 bg-gradient-to-br from-[var(--card)] to-[var(--primary)]/5">
          <CardContent className="space-y-3 pt-5">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {locale === "te" ? "కుటుంబ సాధనాలు & సిమ్యులేటర్లు" : "Family Decision Tools"}
            </p>
            <div className="space-y-2">
              <a
                href="/roi"
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-2.5 text-xs font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-[var(--foreground)]">
                    {locale === "te" ? "3-సంవత్సరాల ROI సిమ్యులేటర్" : "3-Year ROI Simulator"}
                  </span>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {locale === "te" ? "BA/BCom అప్పు vs ITI సంపాదనల పోలిక" : "BA/BCom debt vs NSQF ITI earnings"}
                  </p>
                </div>
                <Badge variant="success">{locale === "te" ? "+₹7.3L నికర" : "+₹7.3L Net"}</Badge>
              </a>

              <a
                href="/family"
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-2.5 text-xs font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-[var(--foreground)]">
                    {locale === "te" ? "కుటుంబ విశ్వాస ధృవీకరణ పత్రం" : "Vocational Trust Certificate"}
                  </span>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {locale === "te" ? "బంధువులకు చూపించడానికి వాట్సాప్ షేర్" : "Shareable NCVT credential for WhatsApp"}
                  </p>
                </div>
                <Badge variant="accent">{locale === "te" ? "సర్టిఫికేట్" : "Trust Card"}</Badge>
              </a>

              {!showEscalation ? (
                <button
                  type="button"
                  onClick={() => setShowEscalation(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-2.5 text-xs font-medium transition-colors hover:border-[var(--primary)] hover:bg-[var(--secondary)] text-left"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[var(--foreground)]">
                      {locale === "te" ? "నోడల్ అధికారితో మాట్లాడండి" : "Talk to ITI Nodal Officer"}
                    </span>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {locale === "te" ? "స్థానిక ప్రభుత్వ ఐటిఐ నుండి ఉచిత కాల్" : "Free phone callback from Govt ITI desk"}
                    </p>
                  </div>
                  <PhoneCall className="h-4 w-4 text-[var(--primary)]" />
                </button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-5">
            <p className="text-sm font-semibold">{locale === "te" ? "సూచించిన ప్రశ్నలు" : "Suggested questions"}</p>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void ask(question)}
                  className="rounded-lg border border-[var(--border)] p-2 text-left text-sm hover:bg-[var(--secondary)]"
                  disabled={busy}
                >
                  {question}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-5 text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">
              {locale === "te" ? "ఈ సహాయకుడు ఏమి చేయదు" : "What this assistant will not do"}
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs">
              <li>{locale === "te" ? "జీతం లేదా ఉద్యోగం హామీ ఇవ్వదు" : "It will not guarantee a salary, job or admission"}</li>
              <li>{locale === "te" ? "మీ తరఫున నిర్ణయం తీసుకోదు" : "It will not decide for the student"}</li>
              <li>{locale === "te" ? "మూలాలు లేకుండా సమాధానం ఇవ్వదు" : "It will not answer without citing a retrieved source"}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
