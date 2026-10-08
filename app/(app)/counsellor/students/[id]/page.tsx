import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NotesEditor } from "@/components/counsellor/notes-editor";
import { Badge, Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@/components/ui/primitives";
import { FactorBars } from "@/components/ui/misc";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { getCareer } from "@/lib/data";
import { getStudentById } from "@/lib/queries";
import type { Recommendation } from "@/lib/types";

export default async function CounsellorStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || (user.role !== "counsellor" && user.role !== "admin")) redirect("/dashboard");

  const { id } = await params;
  const locale = await currentLocale();
  const data = await getStudentById(id);
  if (!data.overview && !data.assessment) notFound();

  const top = data.recommendations[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link className="text-sm text-[var(--muted-foreground)] hover:underline" href="/counsellor">
            ← {locale === "te" ? "విద్యార్థుల జాబితా" : "Student roster"}
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{data.overview?.name ?? id}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {data.profile?.educationLevel ?? "—"} · {data.profile?.constraints.district || "—"}
            {data.overview?.status ? ` · ${data.overview.status.replace("_", " ")}` : ""}
          </p>
        </div>
        {top ? <Badge variant="outline">{top.engineVersion} · {top.weightsVersion}</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{locale === "te" ? "స్కోర్ చేయబడిన ప్రొఫైల్" : "Scored profile"}</CardTitle>
            <CardDescription>
              {data.profile
                ? `Completeness ${Math.round(data.profile.coverage * 100)}% · ${Object.keys(data.profile.interests).length} interests, ${Object.keys(data.profile.skills).length} skills rated`
                : "No assessment submitted yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.profile ? (
              <>
                {(Object.entries(data.profile.interests) as [string, number][])
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([slug, value]) => (
                    <div key={slug}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="capitalize">{slug}</span>
                        <span className="tabular-nums text-[var(--muted-foreground)]">{value}</span>
                      </div>
                      <Progress value={value} />
                    </div>
                  ))}
              </>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">—</p>
            )}
          </CardContent>
        </Card>

        {top ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "te" ? "అగ్ర సూచన యొక్క ఫ్యాక్టర్లు" : "Factor breakdown — top recommendation"}
              </CardTitle>
              <CardDescription>
                {getCareer(top.careerSlug)?.title_en ?? top.careerSlug} · {top.score}% (
                {Math.round(top.confidence * 100)}% of weighting covered)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FactorBars contributions={top.contributions} locale={locale} />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "te" ? "సూచనలు" : "Recommendations"}</CardTitle>
          <CardDescription>
            {locale === "te"
              ? "ఇంజిన్ ఇచ్చిన క్రమం, కారణాలతో."
              : "Engine ranking with the reasons, so you can agree or push back with evidence."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recommendations.slice(0, 5).map((rec: Recommendation, index: number) => {
            const career = getCareer(rec.careerSlug);
            return (
              <div key={rec.careerSlug} className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    #{index + 1} {career?.title_en ?? rec.careerSlug}
                  </p>
                  <span className="tabular-nums font-semibold">{rec.score}%</span>
                </div>
                <ul className="mt-1 list-disc pl-5 text-xs text-[var(--muted-foreground)]">
                  {rec.explanation.strongAlignment.slice(0, 3).map((item: string) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <ButtonLink className="mt-2 inline-block" href={`/careers/${rec.careerSlug}`} size="sm" variant="ghost">
                    {locale === "te" ? "వృత్తి వివరాలు" : "Career detail"}
                  </ButtonLink>
              </div>
            );
          })}
          {data.recommendations.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              {locale === "te" ? "ఇంకా సూచనలు లేవు." : "No recommendations yet — assessment pending."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <NotesEditor
        locale={locale}
        studentId={id}
        recommendationId={data.recommendations[0]?.id ?? null}
        initialNotes={data.notes}
      />
    </div>
  );
}
