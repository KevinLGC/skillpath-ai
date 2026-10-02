import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Info, Sparkles } from "lucide-react";
import { Badge, Card, CardContent, Progress } from "@/components/ui/primitives";
import { FACTOR_LABELS } from "@/lib/recommendation/weights";
import { cn } from "@/lib/utils/cn";
import type { AnswerSource, DataQuality, FactorContribution, Locale, RoadmapStep } from "@/lib/types";

/* --------------------------------- provenance ---------------------------------- */

const QUALITY_COPY: Record<DataQuality, { en: string; te: string; variant: "success" | "warning" | "accent" | "muted"; icon: typeof Info }> = {
  sourced: { en: "Sourced", te: "మూలం ధృవీకరించబడింది", variant: "success", icon: CheckCircle2 },
  estimated: { en: "Estimate", te: "అంచనా", variant: "warning", icon: Info },
  illustrative: { en: "Illustrative demo data", te: "ఉదాహరణ డేటా", variant: "accent", icon: AlertTriangle },
  guidance: { en: "General guidance", te: "సాధారణ మార్గదర్శనం", variant: "muted", icon: Info },
};

/**
 * Provenance badge. This component is the reason the plan's "label estimates and
 * sourced facts" rule is actually enforced: figures cannot be rendered without
 * declaring what they are.
 */
export function QualityBadge({ quality, locale = "en" }: { quality: DataQuality; locale?: Locale }) {
  const copy = QUALITY_COPY[quality];
  const Icon = copy.icon;
  return (
    <Badge variant={copy.variant} title={copy.en}>
      <Icon className="h-3 w-3" aria-hidden />
      {locale === "te" ? copy.te : copy.en}
    </Badge>
  );
}

export function Disclaimer({ locale = "en" }: { locale?: Locale }) {
  return (
    <p className="text-xs text-[var(--muted-foreground)]">
      {locale === "te"
        ? "ఏఐ మార్గదర్శనం అందిస్తుంది; వృత్తి నిపుణుల కౌన్సెలింగ్‌కు ప్రత్యామ్నాయం కాదు."
        : "AI provides guidance and does not replace professional career counselling."}
    </p>
  );
}

/* --------------------------------- factor display -------------------------------- */

/** Factor breakdown: the visible half of the "explainable AI" claim. */
export function FactorBars({
  contributions,
  locale = "en",
  showDetails = true,
}: {
  contributions: FactorContribution[];
  locale?: Locale;
  showDetails?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {contributions.map((item) => {
        const label = FACTOR_LABELS[item.factor][locale];
        const percent = Math.round(item.score * 100);
        return (
          <li key={item.factor}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className={cn("font-medium", !item.available && "text-[var(--muted-foreground)]")}>{label}</span>
              <span className="tabular-nums text-[var(--muted-foreground)]">
                {item.available ? `${percent}%` : locale === "te" ? "డేటా లేదు" : "no data"}
                <span className="ml-1 text-xs opacity-70">({Math.round(item.weight * 100)}% wt)</span>
              </span>
            </div>
            <Progress
              value={item.available ? percent : 0}
              tone={percent >= 70 ? "success" : percent < 50 ? "warning" : "primary"}
            />
            {showDetails && item.available ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.detail}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------- sources ----------------------------------- */

export function SourceList({ sources, locale = "en" }: { sources: AnswerSource[]; locale?: Locale }) {
  if (sources.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {locale === "te" ? "మూలాలు" : "Sources"}
      </p>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.marker} className="rounded-lg border border-[var(--border)] p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">[{source.marker}]</Badge>
              <span className="font-medium">{source.title}</span>
              <QualityBadge quality={source.dataQuality} locale={locale} />
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {source.sourceOrg} · retrieved {source.retrievedAt} ·{" "}
              <a className="underline" href={source.sourceUrl} target="_blank" rel="noreferrer noopener">
                official source <ArrowUpRight className="inline h-3 w-3" aria-hidden />
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------- roadmap ------------------------------------ */

export function RoadmapTimeline({ steps, youAreHereIndex }: { steps: RoadmapStep[]; youAreHereIndex: number }) {
  return (
    <ol className="relative space-y-4 border-l border-[var(--border)] pl-6">
      {steps.map((step, index) => {
        const isCurrent = index === youAreHereIndex;
        return (
          <li key={`${step.stage}-${step.title_en}`} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border",
                step.status === "done" && "border-[var(--success)] bg-[var(--success)]",
                isCurrent && "border-[var(--primary)] bg-[var(--primary)]",
                step.status === "upcoming" && "border-[var(--border)] bg-[var(--card)]",
              )}
              aria-hidden
            />
            <div className={cn("rounded-lg border p-3", isCurrent ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)]")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{step.title_en}</span>
                <Badge variant={isCurrent ? "default" : "outline"}>
                  {isCurrent ? "You are here" : step.status === "done" ? "Done" : "Upcoming"}
                </Badge>
                {step.optional ? <Badge variant="muted">Optional</Badge> : null}
                {step.duration_months ? <span className="text-xs text-[var(--muted-foreground)]">{step.duration_months} months</span> : null}
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{step.note_en}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------- empty state --------------------------------- */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <Sparkles className="h-6 w-6 text-[var(--muted-foreground)]" aria-hidden />
        <p className="font-medium">{title}</p>
        <p className="max-w-md text-sm text-[var(--muted-foreground)]">{body}</p>
        {action}
      </CardContent>
    </Card>
  );
}

export function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="font-medium text-[var(--primary)] underline underline-offset-2" href={href}>
      {children}
    </Link>
  );
}
