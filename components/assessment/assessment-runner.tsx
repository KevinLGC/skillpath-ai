"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Wand2 } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Select,
} from "@/components/ui/primitives";
import { DEFAULT_SCALE_OPTIONS } from "@/lib/assessment/scale";
import { DEMO_ANSWERS, DEMO_CONSTRAINTS } from "@/lib/demo/answers";
import { EDUCATION_LABELS, EDUCATION_LEVELS, type AssessmentQuestion, type EducationLevel } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type AnswerValue = string | string[];

interface RunnerProps {
  questions: AssessmentQuestion[];
  locale: "en" | "te";
  districts: string[];
  /** Default education level from an existing profile, if any. */
  initialEducation?: EducationLevel;
}

const STORAGE_KEY = "sp_assessment_draft_v1";

/**
 * Assessment runner.
 *
 * Drafts are saved to localStorage as the student goes, so a dropped connection
 * or an accidental refresh does not lose twenty-four answers — and the final
 * submission is validated and scored on the server.
 */
export function AssessmentRunner({ questions, locale, districts, initialEducation }: RunnerProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(initialEducation ?? "class12");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [income, setIncome] = useState("");
  const [district, setDistrict] = useState(districts[0] ?? "");
  const [hard, setHard] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);

  const totalSteps = questions.length + 1;
  const isConstraintsStep = step === questions.length;
  const currentQuestion = questions[step];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        answers?: Record<string, AnswerValue>;
        educationLevel?: EducationLevel;
        budget?: string;
        duration?: string;
        income?: string;
        district?: string;
        hard?: string[];
      };
      if (draft.answers && Object.keys(draft.answers).length > 0) {
        setAnswers(draft.answers);
        setRestoredDraft(true);
      }
      if (draft.educationLevel) setEducationLevel(draft.educationLevel);
      if (draft.budget) setBudget(draft.budget);
      if (draft.duration) setDuration(draft.duration);
      if (draft.income) setIncome(draft.income);
      if (draft.district) setDistrict(draft.district);
      if (draft.hard) setHard(draft.hard);
    } catch {
      // corrupted draft: start clean rather than blocking the assessment
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, educationLevel, budget, duration, income, district, hard }),
      );
    } catch {
      // private mode / storage full: the assessment still works without a draft
    }
  }, [answers, educationLevel, budget, duration, income, district, hard]);

  const answeredCount = useMemo(
    () => questions.filter((question) => {
      const value = answers[question.id];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    }).length,
    [answers, questions],
  );

  const setAnswer = useCallback((questionId: string, value: AnswerValue) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }, []);

  function prefillDemo() {
    const demo: Record<string, AnswerValue> = {};
    for (const answer of DEMO_ANSWERS) demo[answer.questionId] = answer.value;
    setAnswers(demo);
    setBudget(String(DEMO_CONSTRAINTS.budgetMaxInr ?? ""));
    setDuration(String(DEMO_CONSTRAINTS.durationMaxMonths ?? ""));
    setIncome(String(DEMO_CONSTRAINTS.minIncomeInr ?? ""));
    setDistrict(DEMO_CONSTRAINTS.district);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const payload = {
      educationLevel,
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      constraints: {
        budgetMaxInr: budget ? Number(budget) : null,
        durationMaxMonths: duration ? Number(duration) : null,
        minIncomeInr: income ? Number(income) : null,
        state: "Andhra Pradesh",
        district,
        hard,
      },
    };

    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not save the assessment. Please try again.");
        setSubmitting(false);
        return;
      }

      const body = (await response.json()) as { redirect?: string };
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      // Leave `submitting` true through the navigation so the button does not
      // flicker back to "See my matches" mid-redirect.
      router.push(body.redirect ?? "/results");
      router.refresh();
    } catch {
      setError("Network problem — the assessment was not saved. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              {isConstraintsStep
                ? locale === "te"
                  ? "మీ పరిస్థితి"
                  : "Your situation"
                : locale === "te"
                  ? `ప్రశ్న ${step + 1} / ${questions.length}`
                  : `Question ${step + 1} of ${questions.length}`}
            </CardTitle>
            <Badge variant="outline">
              {locale === "te" ? `${answeredCount} సమాధానాలు` : `${answeredCount} answered`}
            </Badge>
          </div>
          <CardDescription>
            {locale === "te"
              ? "నిజాయితీగా సమాధానం ఇవ్వండి. తప్పు సమాధానాలు అనేవి ఉండవు."
              : "Answer honestly — there are no right answers, and skipped questions are excluded rather than guessed."}
          </CardDescription>
          <div className="mt-2">
            <Progress value={isConstraintsStep ? 100 : progress} />
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {restoredDraft ? (
            <Alert variant="info">
              <p className="flex items-center gap-2">
                <Save className="h-4 w-4" aria-hidden />
                {locale === "te"
                  ? "మీ మునుపటి సమాధానాలు ఈ బ్రౌజర్‌లో భద్రపరచబడ్డాయి."
                  : "Your earlier answers were restored from this browser."}
              </p>
            </Alert>
          ) : null}

          {!isConstraintsStep && currentQuestion ? (
            <QuestionField
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={(value) => setAnswer(currentQuestion.id, value)}
              locale={locale}
            />
          ) : null}

          {isConstraintsStep ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="education">{locale === "te" ? "ప్రస్తుత విద్య" : "Current education level"}</Label>
                <Select
                  id="education"
                  value={educationLevel}
                  onChange={(event) => setEducationLevel(event.target.value as EducationLevel)}
                >
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {EDUCATION_LABELS[level][locale]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="budget">{locale === "te" ? "గరిష్ఠ బడ్జెట్ (₹)" : "Max training budget (₹)"}</Label>
                  <Input id="budget" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="30000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">{locale === "te" ? "గరిష్ఠ కాలం (నెలలు)" : "Max duration (months)"}</Label>
                  <Input id="duration" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="24" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income">{locale === "te" ? "కనీస ఆదాయం (₹/నెల)" : "Min income (₹/month)"}</Label>
                  <Input id="income" inputMode="numeric" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="14000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">{locale === "te" ? "జిల్లా" : "District"}</Label>
                <Select id="district" value={district} onChange={(event) => setDistrict(event.target.value)}>
                  {districts.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {locale === "te"
                    ? "జిల్లా స్థానిక అవకాశాలను చూపడానికి మాత్రమే ఉపయోగించబడుతుంది."
                    : "Used for local opportunity matching. Leave figures blank if unknown — blanks are excluded, not guessed."}
                </p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  {locale === "te" ? "కఠిన పరిమితులు" : "Treat as non-negotiable"}
                </legend>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {locale === "te"
                    ? "ఎంచుకున్నవి నెరవేరకపోతే ఆ వృత్తి జాబితా నుండి తీసివేయబడుతుంది."
                    : "Selected constraints filter careers out entirely instead of lowering their score."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "budget", label: locale === "te" ? "బడ్జెట్" : "Budget" },
                    { key: "duration", label: locale === "te" ? "కాలపరిమితి" : "Duration" },
                    { key: "income", label: locale === "te" ? "ఆదాయం" : "Income" },
                    { key: "location", label: locale === "te" ? "ప్రాంతం" : "Location" },
                  ].map((option) => {
                    const active = hard.includes(option.key);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setHard((previous) =>
                            previous.includes(option.key)
                              ? previous.filter((item) => item !== option.key)
                              : [...previous, option.key],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs",
                          active
                            ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                            : "border-[var(--border)] hover:bg-[var(--accent)]",
                        )}
                      >
                        {active ? <Check className="mr-1 inline h-3 w-3" aria-hidden /> : null}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {error ? <Alert variant="danger" title={locale === "te" ? "లోపం" : "Something went wrong"}>{error}</Alert> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {locale === "te" ? "వెనుకకు" : "Back"}
              </Button>
              <Button variant="ghost" size="sm" onClick={prefillDemo} title="Fill with the demo student's answers">
                <Wand2 className="h-4 w-4" aria-hidden />
                {locale === "te" ? "డెమో సమాధానాలు" : "Use demo answers"}
              </Button>
            </div>

            {isConstraintsStep ? (
              <Button onClick={() => void submit()} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {locale === "te" ? "ఫలితాలు చూడండి" : "See my matches"}
              </Button>
            ) : (
              <Button onClick={() => setStep((value) => Math.min(questions.length, value + 1))}>
                {locale === "te" ? "తరువాత" : "Next"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>

          {!isConstraintsStep && answers[questions[step]?.id ?? ""] === undefined ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {locale === "te"
                ? "సమాధానం ఎంచుకోండి, లేదా దాటవేయడానికి తరువాత నొక్కండి."
                : "Choose an answer to continue. You can skip by moving on — the question will simply be excluded."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  locale,
}: {
  question: AssessmentQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  locale: "en" | "te";
}) {
  const options = question.type === "scale" ? DEFAULT_SCALE_OPTIONS : (question.options ?? []);
  const label = locale === "te" ? question.text_te : question.text_en;

  if (question.type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="space-y-3">
        <legend className="text-base font-medium">{label}</legend>
        {question.helper_en ? <p className="text-xs text-[var(--muted-foreground)]">{question.helper_en}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const active = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm",
                  active ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:bg-[var(--secondary)]",
                )}
              >
                <span>{locale === "te" ? option.label_te : option.label_en}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={active}
                  onChange={() =>
                    onChange(active ? selected.filter((item) => item !== option.value) : [...selected, option.value])
                  }
                />
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-medium">{label}</legend>
      <div className="space-y-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm",
                active ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:bg-[var(--secondary)]",
              )}
            >
              <span>{locale === "te" ? option.label_te : option.label_en}</span>
              <input
                type="radio"
                name={question.id}
                className="h-4 w-4"
                checked={active}
                onChange={() => onChange(option.value)}
              />
            </label>
          );
        })}
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {locale === "te"
          ? "ఈ సమాధానం మీ ప్రొఫైల్‌లో భాగం అవుతుంది; ఏదీ తప్పు కాదు."
          : "This feeds your structured profile. Nothing here is right or wrong."}
      </p>
    </fieldset>
  );
}
