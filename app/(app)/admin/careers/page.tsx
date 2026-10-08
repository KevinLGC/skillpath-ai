import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { QualityBadge } from "@/components/ui/misc";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { careers, coursesForCareer, documentsForCareer, jobsForCareer } from "@/lib/data";
import { estimatedTrainingCost } from "@/lib/recommendation";
import { EDUCATION_LABELS } from "@/lib/types";

export default async function AdminCareersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  const locale = await currentLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Career content</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {careers.length} pathways. Content is file-seeded today ({`data/careers.json`}), so edits are reviewed in version
          control; the Supabase schema supports moving this to database-backed editing without changing the engine.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All pathways</CardTitle>
          <CardDescription>
            Cost and income figures are demonstration values until a sourced document replaces them.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--secondary)] text-left">
                <th className="p-2 font-medium">Career</th>
                <th className="p-2 font-medium">Entry</th>
                <th className="p-2 font-medium">Duration</th>
                <th className="p-2 font-medium">Est. cost</th>
                <th className="p-2 font-medium">Content</th>
                <th className="p-2 font-medium">Provenance</th>
              </tr>
            </thead>
            <tbody>
              {careers.map((career, index) => (
                <tr key={career.slug} className={index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--secondary)]"}>
                  <td className="p-2">
                    <Link className="font-medium underline" href={`/careers/${career.slug}`}>
                      {career.title_en}
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)]">{career.slug}</p>
                  </td>
                  <td className="p-2">{EDUCATION_LABELS[career.min_education_level][locale]}</td>
                  <td className="p-2 tabular-nums">
                    {career.duration_months_min}–{career.duration_months_max} mo
                  </td>
                  <td className="p-2">
                    <span className="flex items-center gap-2">
                      ₹{estimatedTrainingCost(career).amountInr.toLocaleString("en-IN")}
                      <QualityBadge quality="illustrative" locale={locale} />
                    </span>
                  </td>
                  <td className="p-2 text-xs text-[var(--muted-foreground)]">
                    {coursesForCareer(career.slug).length} courses · {jobsForCareer(career.slug).length} roles ·{" "}
                    {documentsForCareer(career.slug).length} docs
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <QualityBadge quality={career.data_quality} locale={locale} />
                      <a className="text-xs underline" href={career.source_url} target="_blank" rel="noreferrer noopener">
                        {career.source_org}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editorial rules enforced by the build</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>• Every career must reference skills and interests that exist in the taxonomy (seed integrity test).</p>
          <p>• Every knowledge document must carry an official source URL, retrieval date and licence note.</p>
          <p>• Every assessment question must have a Telugu translation before it can ship.</p>
          <p>• Illustrative figures cannot render without a provenance badge — the UI requires the label.</p>
          <p className="pt-2">
            <ButtonLink href="/resources" size="sm" variant="outline">
                Review the knowledge base
              </ButtonLink>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
