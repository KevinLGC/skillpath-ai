"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { FACTOR_LABELS } from "@/lib/recommendation/weights";
import type { FactorContribution, Locale } from "@/lib/types";

/** Radar of the six factors behind a match. Unavailable factors plot at 0 and are labelled as such. */
export function FactorRadar({ contributions, locale = "en" }: { contributions: FactorContribution[]; locale?: Locale }) {
  const data = contributions.map((item) => ({
    factor: FACTOR_LABELS[item.factor][locale],
    score: Math.round(item.score * 100),
    available: item.available,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="factor" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} angle={90} />
          <Radar
            name={locale === "te" ? "స్కోరు" : "Score"}
            dataKey="score"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.25}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value, _name, payload) => [
              payload?.payload?.available ? `${value}%` : "no data",
              locale === "te" ? "స్కోరు" : "Score",
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
