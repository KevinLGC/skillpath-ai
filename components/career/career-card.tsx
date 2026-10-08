import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Badge, Button, ButtonLink, Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui/primitives";
import { QualityBadge } from "@/components/ui/misc";
import { getCareer } from "@/lib/data";
import type { Locale, Recommendation } from "@/lib/types";

/**
 * Recommendation card. The score is never shown without its basis: confidence,
 * the factors that drove it, and the label for the underlying data.
 */
export function CareerCard({
  recommendation,
  locale = "en",
  rank,
}: {
  recommendation: Recommendation;
  locale?: Locale;
  rank?: number;
}) {
  const career = getCareer(recommendation.careerSlug);
  if (!career) return null;

  const available = recommendation.contributions.filter((item) => item.available).length;
  const strongest = [...recommendation.contributions]
    .filter((item) => item.available)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {typeof rank === "number" ? <Badge variant="muted">#{rank}</Badge> : null}
              <QualityBadge quality={career.data_quality} locale={locale} />
            </div>
            <CardTitle className="mt-2">
              <Link className="hover:underline" href={`/careers/${career.slug}`}>
                {locale === "te" ? career.title_te : career.title_en}
              </Link>
            </CardTitle>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">{recommendation.score}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "సరిపోలిక" : "fit score"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">{locale === "te" ? career.summary_te : career.summary_en}</p>

        <div>
          <Progress value={recommendation.score} tone={recommendation.score >= 75 ? "success" : "primary"} />
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Info className="h-3 w-3" aria-hidden />
            {locale === "te"
              ? `${available}/6 అంశాల ఆధారంగా · ${Math.round(recommendation.confidence * 100)}% బరువు`
              : `Based on ${available} of 6 scoring factors · ${Math.round(recommendation.confidence * 100)}% of the weighting`}
          </p>
        </div>

        {strongest.length > 0 ? (
          <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
            {strongest.map((item) => (
              <li key={item.factor}>• {item.detail}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2">
          <ButtonLink href={`/careers/${career.slug}`} size="sm" variant="outline">
              {locale === "te" ? "వివరాలు" : "Details"}
            </ButtonLink>
          <ButtonLink href={`/roadmap?career=${career.slug}`} size="sm" variant="ghost">
              {locale === "te" ? "రోడ్‌మ్యాప్" : "Roadmap"}
            </ButtonLink>
          <ButtonLink href={`/compare?a=${career.slug}`} size="sm" variant="ghost">
              {locale === "te" ? "పోల్చండి" : "Compare"} <ArrowRight className="h-3 w-3" aria-hidden />
            </ButtonLink>
        </div>
      </CardContent>
    </Card>
  );
}
