"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui/primitives";
import type { Locale } from "@/lib/types";

/**
 * Cost simulator. The training figure comes from the engine's cost estimate
 * (seeded course fee or cost band); living and transport are explicit inputs
 * because they differ per family. Every number keeps its provenance label.
 */
export function CostSimulator({
  locale,
  trainingCostInr,
  durationMonthsMin,
  durationMonthsMax,
  monthlyLivingInr,
}: {
  locale: Locale;
  trainingCostInr: number;
  durationMonthsMin: number;
  durationMonthsMax: number;
  monthlyLivingInr: number;
}) {
  const [training, setTraining] = useState(trainingCostInr);
  const [months, setMonths] = useState(durationMonthsMax);
  const [monthly, setMonthly] = useState(monthlyLivingInr);

  const living = Math.max(0, months) * Math.max(0, monthly);
  const total = Math.max(0, training) + living;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-4 w-4" aria-hidden />
          {locale === "te" ? "ఖర్చు అంచనా" : "Cost simulator"}
        </CardTitle>
        <CardDescription>
          {locale === "te"
            ? "సంఖ్యలను మీరు సర్దుబాటు చేయవచ్చు — ఇవి నిర్ణయం కోసం అంచనాలు, అధికారిక ఫీజులు కావు."
            : "Adjust any figure to match your family's situation. These are planning estimates, not official fee quotations."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="sim-training">{locale === "te" ? "శిక్షణ ఖర్చు (₹)" : "Training cost (₹)"}</Label>
            <Input id="sim-training" inputMode="numeric" value={training} onChange={(event) => setTraining(Number(event.target.value) || 0)} />
            <p className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? `సూచన: ${trainingCostInr.toLocaleString("en-IN")}` : `Engine estimate: ₹${trainingCostInr.toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sim-months">{locale === "te" ? "నెలలు" : "Months of training"}</Label>
            <Input id="sim-months" inputMode="numeric" value={months} onChange={(event) => setMonths(Number(event.target.value) || 0)} />
            <p className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? `మార్గం: ${durationMonthsMin}–${durationMonthsMax}` : `Pathway: ${durationMonthsMin}–${durationMonthsMax} months`}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sim-monthly">{locale === "te" ? "నెలవారీ నిర్వహణ (₹)" : "Living / transport per month (₹)"}</Label>
            <Input id="sim-monthly" inputMode="numeric" value={monthly} onChange={(event) => setMonthly(Number(event.target.value) || 0)} />
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-[var(--border)] p-4">
          <Row
            label={locale === "te" ? "శిక్షణ" : "Training"}
            value={training}
            quality={locale === "te" ? "ఉదాహరణ" : "illustrative"}
          />
          <Row
            label={locale === "te" ? `నిర్వహణ (${months} నెలలు)` : `Living / transport (${months} months)`}
            value={living}
            quality={locale === "te" ? "మీ ఇన్‌పుట్" : "your input"}
          />
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <span className="font-medium">{locale === "te" ? "మొత్తం ప్రారంభ ఖర్చు" : "Total initial cost"}</span>
            <span className="text-xl font-bold tabular-nums">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <p className="text-xs text-[var(--muted-foreground)]">
          {locale === "te"
            ? "ఉచిత/సబ్సిడీ కోర్సులు, స్కాలర్‌షిప్‌లు ఉండవచ్చు — అధికారిక పోర్టల్‌లో ధృవీకరించండి."
            : "Fee waivers, subsidised skill courses and scholarship schemes may reduce the training line. Verify what applies to you on the official portals — eligibility rules change per batch."}
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, quality }: { label: string; value: number; quality: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-medium tabular-nums">₹{value.toLocaleString("en-IN")}</span>
        <Badge variant={quality === "illustrative" ? "accent" : "muted"}>{quality}</Badge>
      </span>
    </div>
  );
}
