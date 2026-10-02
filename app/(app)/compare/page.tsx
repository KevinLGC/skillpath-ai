import Link from "next/link";
import { ComparePicker } from "@/components/career/compare-picker";
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { EmptyState, QualityBadge } from "@/components/ui/misc";
import { currentLocale } from "@/lib/auth/session";
import { coursesForCareer, getCareer, getSkillName } from "@/lib/data";
import { estimatedTrainingCost } from "@/lib/recommendation";
import { recommendationFor } from "@/lib/recommendation";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";
import { EDUCATION_LABELS, type Locale } from "@/lib/types";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; c?: string }>;
}) {
  const locale: Locale = await currentLocale();
  const t = createTranslator(locale);
  const params = await searchParams;
  const context = await getStudentContext();

  const requested = [params.a, params.b, params.c].filter((slug): slug is string => Boolean(slug));
  const selected = requested.map((slug) => getCareer(slug)).filter((career) => career !== undefined);

  const options =
    context.profile && context.recommendations.length > 0
      ? context.recommendations.slice(0, 8).map((rec) => ({
          slug: rec.careerSlug,
          title: getCareer(rec.careerSlug)?.title_en ?? rec.careerSlug,
          score: rec.score,
        }))
      : [];

  if (selected.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("compare.title")}</h1>
        {options.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{locale === "te" ? "వృత్తులను ఎంచుకోండి" : "Choose careers"}</CardTitle>
              <CardDescription>{t("compare.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ComparePicker options={options} selected={[]} locale={locale} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title={locale === "te" ? "ఇంకా సూచనలు లేవు" : "No matches to compare yet"}
            body={
              locale === "te"
                ? "అసెస్‌మెంట్ పూర్తి చేసిన తర్వాత సూచించిన వృత్తులను ఇక్కడ పోల్చవచ్చు."
                : "Complete the assessment to compare your matched pathways, or open any career page and choose Compare."
            }
            action={
              <Link href="/assessment" className="mt-2 inline-block">
                <Button size="sm">{t("home.hero.cta")}</Button>
              </Link>
            }
          />
        )}
      </div>
    );
  }

  const rows: { label: string; render: (career: NonNullable<ReturnType<typeof getCareer>>) => React.ReactNode }[] = [
    {
      label: locale === "te" ? "మీ సరిపోలిక" : "Your fit score",
      render: (career) => {
        if (!context.profile) return "—";
        const rec = recommendationFor(context.profile, career);
        return (
          <span className="font-semibold tabular-nums">
            {rec.score}%{" "}
            <span className="text-xs font-normal text-[var(--muted-foreground)]">
              ({Math.round(rec.confidence * 100)}% {locale === "te" ? "బరువు" : "weighting"})
            </span>
          </span>
        );
      },
    },
    {
      label: locale === "te" ? "కనీస అర్హత" : "Entry requirement",
      render: (career) => EDUCATION_LABELS[career.min_education_level][locale],
    },
    {
      label: locale === "te" ? "శిక్షణ కాలం" : "Training duration",
      render: (career) => `${career.duration_months_min}–${career.duration_months_max} ${locale === "te" ? "నెలలు" : "months"}`,
    },
    {
      label: locale === "te" ? "ఖర్చు" : "Cost",
      render: (career) => (
        <span className="flex flex-wrap items-center gap-2">
          ₹{estimatedTrainingCost(career).amountInr.toLocaleString("en-IN")}
          <QualityBadge quality="illustrative" locale={locale} />
        </span>
      ),
    },
    {
      label: locale === "te" ? "పని ప్రదేశం" : "Work environment",
      render: (career) => career.work_environment,
    },
    {
      label: locale === "te" ? "తరలింపు" : "Relocation",
      render: (career) => career.relocation_likelihood,
    },
    {
      label: locale === "te" ? "స్వయం ఉపాధి" : "Self-employment",
      render: (career) => career.entrepreneurship,
    },
    {
      label: locale === "te" ? "ప్రారంభ ఆదాయం" : "Starting income",
      render: (career) => (
        <span className="flex flex-wrap items-center gap-2">
          ₹{career.income_band_min.toLocaleString("en-IN")}–{career.income_band_max.toLocaleString("en-IN")}
          <QualityBadge quality="illustrative" locale={locale} />
        </span>
      ),
    },
    {
      label: locale === "te" ? "ముఖ్య నైపుణ్యాలు" : "Key skills",
      render: (career) => (
        <ul className="list-disc pl-4 text-xs">
          {career.skills.slice(0, 4).map((skill) => (
            <li key={skill.slug}>
              {getSkillName(skill.slug, locale)} ({skill.level}/100{skill.priority ? ", priority" : ""})
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: locale === "te" ? "ఎదుగుదల" : "Progression",
      render: (career) => career.pathways[career.pathways.length - 1]?.title_en ?? "—",
    },
    {
      label: locale === "te" ? "అదనపు విద్య" : "Further education",
      render: (career) => (
        <ul className="list-disc pl-4 text-xs">
          {career.further_education_en.slice(0, 2).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    },
    {
      label: locale === "te" ? "కోర్సులు" : "Seeded courses",
      render: (career) => `${coursesForCareer(career.slug).length}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("compare.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">{t("compare.subtitle")}</p>
      </div>

      {options.length > 0 ? (
        <Card>
          <CardContent className="pt-5">
            <ComparePicker options={options} selected={selected.map((career) => career.slug)} locale={locale} />
          </CardContent>
        </Card>
      ) : null}

      <Alert variant="info" title={locale === "te" ? "ఇది ఎవరికీ 'ఉత్తమం' కాదు" : "No winner is declared here"}>
        <p>
          {locale === "te"
            ? "ఈ పోలిక మీ ప్రాధాన్యతల ఆధారంగా వ్యత్యాసాలను చూపుతుంది. ఏది మంచిదో నిర్ణయించడం మీ కుటుంబం చేతిలో ఉంటుంది."
            : "The table shows trade-offs against your stated preferences. Which one is better depends on your family's situation — not on a score."}
        </p>
      </Alert>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--secondary)] text-left">
              <th className="p-3 font-medium">{locale === "te" ? "అంశం" : "Factor"}</th>
              {selected.map((career) => (
                <th key={career.slug} className="p-3 font-semibold">
                  <Link className="underline" href={`/careers/${career.slug}`}>
                    {locale === "te" ? career.title_te : career.title_en}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label} className={index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--secondary)]"}>
                <th scope="row" className="p-3 text-left font-medium text-[var(--muted-foreground)]">
                  {row.label}
                </th>
                {selected.map((career) => (
                  <td key={`${row.label}-${career.slug}`} className="p-3 align-top">
                    {row.render(career)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/family">
          <Button size="sm">{locale === "te" ? "కుటుంబ వీక్షణలో చర్చించండి" : "Discuss in the family view"}</Button>
        </Link>
        <Link href="/results">
          <Button size="sm" variant="outline">
            {locale === "te" ? "అన్ని సూచనలు" : "Back to all matches"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
