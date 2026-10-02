import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/family/print-button";
import { Badge, Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui/primitives";
import { QualityBadge, SourceList } from "@/components/ui/misc";
import { currentLocale } from "@/lib/auth/session";
import { getStore } from "@/lib/db";

/**
 * Printable report. Rendered server-side from the stored snapshot, so printing
 * or saving as PDF reproduces exactly what was generated — no recalculation, no
 * chance of a different number appearing on paper than on screen.
 */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await currentLocale();
  const report = await getStore().getReport(id);
  if (!report) notFound();

  const snapshot = report.snapshot;
  const totalCost = snapshot.costs.reduce((sum, item) => sum + item.amountInr, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <Link className="text-sm underline" href="/family">
          ← {locale === "te" ? "కుటుంబ వీక్షణకు తిరిగి" : "Back to family view"}
        </Link>
        <PrintButton label={locale === "te" ? "ప్రింట్ / PDF" : "Print / save as PDF"} />
      </div>

      <header className="border-b border-[var(--border)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          SkillPath AI · {locale === "te" ? "కుటుంబ నిర్ణయ నివేదిక" : "Family career decision report"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{snapshot.careerTitle}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {snapshot.studentName} · {snapshot.educationLevel} · {snapshot.district} ·{" "}
          {new Date(report.createdAt).toLocaleDateString()}
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[var(--muted-foreground)]">{locale === "te" ? "ఇంజిన్ సరిపోలిక" : "Engine fit"}</p>
            <p className="text-2xl font-bold tabular-nums">{snapshot.score}%</p>
            <Progress value={snapshot.score} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[var(--muted-foreground)]">{locale === "te" ? "మొత్తం అంచనా ఖర్చు" : "Total estimated cost"}</p>
            <p className="text-2xl font-bold tabular-nums">₹{totalCost.toLocaleString("en-IN")}</p>
            <QualityBadge quality="illustrative" locale={locale} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[var(--muted-foreground)]">{locale === "te" ? "మొదటి అడుగు" : "First step"}</p>
            <p className="text-sm font-medium">
              {snapshot.timeline[0]?.label ?? snapshot.pathway[0]?.title_en ?? "—"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{locale === "te" ? "సారాంశం" : "Summary"}</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{snapshot.summary}</p>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">{locale === "te" ? "స్కోరు ఎలా వచ్చింది" : "How the score was calculated"}</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {snapshot.factors.map((factor) => (
              <li key={factor.factor}>
                <div className="mb-1 flex justify-between">
                  <span className="capitalize">{factor.factor.replace("_", " ")}</span>
                  <span className="text-[var(--muted-foreground)]">
                    {factor.available ? `${Math.round(factor.score * 100)}%` : "no data"} · {Math.round(factor.weight * 100)}% weight
                  </span>
                </div>
                <Progress value={factor.available ? factor.score * 100 : 0} />
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{locale === "te" ? "బలమైన సరిపోలిక" : "Strong alignment"}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
              {snapshot.explanation.strongAlignment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">{locale === "te" ? "పరిగణించండి" : "Considerations"}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
              {snapshot.explanation.considerations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">{locale === "te" ? "ఖర్చులు" : "Costs"}</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {snapshot.costs.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-2">
                <span className="text-[var(--muted-foreground)]">{item.label}</span>
                <span className="flex items-center gap-2">
                  ₹{item.amountInr.toLocaleString("en-IN")}
                  <QualityBadge quality={item.quality} locale={locale} />
                </span>
              </li>
            ))}
            <li className="flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
              <span>{locale === "te" ? "మొత్తం" : "Total"}</span>
              <span>₹{totalCost.toLocaleString("en-IN")}</span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">{locale === "te" ? "కాలక్రమం" : "Timeline"}</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {snapshot.pathway.map((stage) => (
              <li key={stage.stage} className="flex justify-between gap-2">
                <span className="text-[var(--muted-foreground)]">
                  {stage.duration_months ? `${stage.duration_months} mo` : "ongoing"}
                </span>
                <span className="text-right">
                  {stage.title_en}
                  {stage.optional ? <Badge variant="muted" className="ml-2">optional</Badge> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{locale === "te" ? "నైపుణ్య లోటు" : "Skills to develop"}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {snapshot.skillGap.map((row) => (
            <li key={row.skill} className="flex justify-between gap-2">
              <span>{row.name_en}</span>
              <span className="text-[var(--muted-foreground)]">
                {row.known ? `${row.have}/100 → ${row.required}/100` : "not rated yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{locale === "te" ? "తరువాత చదువు" : "Further education"}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
          {snapshot.furtherEducation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{locale === "te" ? "మూలాలు" : "Sources"}</h2>
        <div className="mt-2">
          <SourceList sources={snapshot.sources} locale={locale} />
        </div>
      </section>

      <footer className="mt-10 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
        <p>{snapshot.disclaimer}</p>
        <p className="mt-2">
          {locale === "te" ? "నివేదిక ఐడీ" : "Report id"}: {report.id} · {locale === "te" ? "సృష్టించినది" : "generated"}{" "}
          {new Date(report.createdAt).toLocaleString()}
        </p>
      </footer>
    </div>
  );
}
