import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionTitle } from "@/components/ui/primitives";
import { QualityBadge } from "@/components/ui/misc";
import { careers, interests } from "@/lib/data";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { EDUCATION_LABELS, type CostBand, type EducationLevel } from "@/lib/types";

const COST_LABEL: Record<CostBand, { en: string; te: string }> = {
  low: { en: "Low cost", te: "తక్కువ ఖర్చు" },
  medium: { en: "Medium cost", te: "మధ్యస్థ ఖర్చు" },
  high: { en: "Higher cost", te: "ఎక్కువ ఖర్చు" },
};

export default async function CareersPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string; education?: string; cost?: string }>;
}) {
  const locale = await currentLocale();
  const user = await getSessionUser();
  const filters = await searchParams;

  const filtered = careers.filter((career) => {
    if (filters.interest && !career.interests.some((item) => item.slug === filters.interest)) return false;
    if (filters.education && career.min_education_level !== filters.education) return false;
    if (filters.cost && career.cost_band !== filters.cost) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{locale === "te" ? "వృత్తి మార్గాలు" : "Vocational career pathways"}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted-foreground)]">
          {locale === "te"
            ? `${careers.length} మార్గాలు. ప్రతి దానికి శిక్షణ కాలం, ఖర్చు స్థాయి, అవసరమైన నైపుణ్యాలు, ఎదుగుదల దశలు ఉన్నాయి.`
            : `${careers.length} pathways, each with training duration, cost band, required skills and progression stages.`}
        </p>

        <div className="mt-6 space-y-3">
          <FilterRow
            label={locale === "te" ? "ఆసక్తి" : "Interest"}
            active={filters.interest}
            options={[
              { value: undefined, label: locale === "te" ? "అన్నీ" : "All" },
              ...interests.map((interest) => ({
                value: interest.slug,
                label: locale === "te" ? interest.name_te : interest.name_en,
              })),
            ]}
            buildHref={(value) => {
              const params = new URLSearchParams();
              if (value) params.set("interest", value);
              if (filters.education) params.set("education", filters.education);
              if (filters.cost) params.set("cost", filters.cost);
              return `/careers${params.size > 0 ? `?${params.toString()}` : ""}`;
            }}
          />
          <FilterRow
            label={locale === "te" ? "కనీస విద్య" : "Minimum education"}
            active={filters.education}
            options={[
              { value: undefined, label: locale === "te" ? "అన్నీ" : "All" },
              ...(["class8", "class10", "class12"] as EducationLevel[]).map((level) => ({
                value: level,
                label: EDUCATION_LABELS[level][locale],
              })),
            ]}
            buildHref={(value) => {
              const params = new URLSearchParams();
              if (filters.interest) params.set("interest", filters.interest);
              if (value) params.set("education", value);
              if (filters.cost) params.set("cost", filters.cost);
              return `/careers${params.size > 0 ? `?${params.toString()}` : ""}`;
            }}
          />
          <FilterRow
            label={locale === "te" ? "ఖర్చు" : "Cost band"}
            active={filters.cost}
            options={[
              { value: undefined, label: locale === "te" ? "అన్నీ" : "All" },
              ...(["low", "medium", "high"] as CostBand[]).map((band) => ({
                value: band,
                label: COST_LABEL[band][locale],
              })),
            ]}
            buildHref={(value) => {
              const params = new URLSearchParams();
              if (filters.interest) params.set("interest", filters.interest);
              if (filters.education) params.set("education", filters.education);
              if (value) params.set("cost", value);
              return `/careers${params.size > 0 ? `?${params.toString()}` : ""}`;
            }}
          />
        </div>

        <div className="mt-8">
          <SectionTitle hint={locale === "te" ? `${filtered.length} ఫలితాలు` : `${filtered.length} results`}>
            {locale === "te" ? "ఫలితాలు" : "Results"}
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((career) => (
              <Card key={career.slug} className="flex flex-col">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{COST_LABEL[career.cost_band][locale]}</Badge>
                    <Badge variant="outline">
                      {career.duration_months_min === career.duration_months_max
                        ? `${career.duration_months_min} mo`
                        : `${career.duration_months_min}–${career.duration_months_max} mo`}
                    </Badge>
                    <QualityBadge quality={career.data_quality} locale={locale} />
                  </div>
                  <CardTitle className="mt-1">
                    <Link className="hover:underline" href={`/careers/${career.slug}`}>
                      {locale === "te" ? career.title_te : career.title_en}
                    </Link>
                  </CardTitle>
                  <CardDescription>{locale === "te" ? career.summary_te : career.summary_en}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-2 text-xs text-[var(--muted-foreground)]">
                  <p>
                    {locale === "te" ? "కనీస అర్హత: " : "Entry: "}
                    {EDUCATION_LABELS[career.min_education_level][locale]}
                  </p>
                  <p>
                    {locale === "te" ? "ఎదుగుదల: " : "Progression: "}
                    {career.pathways[career.pathways.length - 1]?.title_en}
                  </p>
                  <Link className="inline-block font-medium text-[var(--primary)] underline" href={`/careers/${career.slug}`}>
                    {locale === "te" ? "వివరాలు" : "View details"}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

function FilterRow({
  label,
  active,
  options,
  buildHref,
}: {
  label: string;
  active: string | undefined;
  options: { value: string | undefined; label: string }[];
  buildHref: (value: string | undefined) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</span>
      {options.map((option) => {
        const isActive = (option.value ?? undefined) === (active ?? undefined);
        return (
          <Link
            key={`${label}-${option.value ?? "all"}`}
            href={buildHref(option.value)}
            className={
              isActive
                ? "rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-medium text-[var(--primary-foreground)]"
                : "rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--accent)]"
            }
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
