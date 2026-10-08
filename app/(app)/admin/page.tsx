import { redirect } from "next/navigation";
import { Alert, Badge, Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { QualityBadge } from "@/components/ui/misc";
import { ResistanceHeatmap } from "@/components/admin/resistance-heatmap";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { careers, courses, documents, institutions, jobs, questions, schemes, skills } from "@/lib/data";
import { DEFAULT_WEIGHTS, ENGINE_VERSION, FACTOR_LABELS, WEIGHTS_VERSION } from "@/lib/recommendation";
import { aiModeLabel, EMBEDDING_DIM, GEMINI_EMBED_MODEL, RAG_MIN_SIMILARITY, RAG_TOP_K } from "@/lib/ai/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  const locale = await currentLocale();

  const counts = [
    { label: "Careers", value: careers.length, note: `${careers.filter((c) => c.data_quality === "illustrative").length} labelled illustrative` },
    { label: "Skills", value: skills.length, note: "taxonomy rows" },
    { label: "Questions", value: questions.length, note: "assessment bank" },
    { label: "Institutions", value: institutions.length, note: "seeded providers" },
    { label: "Courses", value: courses.length, note: "linked to careers" },
    { label: "Job roles", value: jobs.length, note: "illustrative ranges" },
    { label: "Schemes", value: schemes.length, note: "source-linked" },
    { label: "Knowledge documents", value: documents.length, note: "RAG knowledge base" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration & State Skill Mission Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Content, engine configuration, AI status, and State Skill Mission resistance telemetry. Nothing here is hidden from the student view — the same data drives the recommendations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((count) => (
          <Card key={count.label}>
            <CardContent className="space-y-1 pt-5">
              <p className="text-2xl font-bold tabular-nums">{count.value}</p>
              <p className="text-sm font-medium">{count.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{count.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* State Skill Mission District Resistance Heatmap & Telemetry */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
          {locale === "te" ? "రాష్ట్ర స్కిల్ మిషన్ ప్రతిఘటన విశ్లేషణ" : "State Skill Mission Parental Resistance Analytics"}
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          {locale === "te"
            ? "జిల్లాల వారీగా తల్లిదండ్రుల వ్యతిరేకత (సామాజిక హోదా, డిగ్రీ వ్యామోహం, ఆదాయం, మహిళా భద్రత) మరియు కన్వర్షన్ రేట్ల హీట్‌మ్యాప్."
            : "Telemetry across districts for parental objections, conversion rates, and CSV export for policy intervention."}
        </p>
        <ResistanceHeatmap locale={locale} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Engine weights</CardTitle>
            <CardDescription>
              Versioned: {ENGINE_VERSION} · {WEIGHTS_VERSION}. Changing weights creates a new version so past
              recommendations stay reproducible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(DEFAULT_WEIGHTS).map(([factor, weight]) => (
              <div key={factor} className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0">
                <span>{FACTOR_LABELS[factor as keyof typeof FACTOR_LABELS].en}</span>
                <span className="tabular-nums">{Math.round(weight * 100)}%</span>
              </div>
            ))}
            <p className="pt-2 text-xs text-[var(--muted-foreground)]">
              Weights are normalised on load, so an editor saving 30/30/20/10/5/5 still produces a valid distribution.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI & retrieval status</CardTitle>
            <CardDescription>Configuration is environment-driven; nothing is hardcoded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>Mode</span>
              <Badge variant={aiModeLabel() === "gemini" ? "success" : "accent"}>{aiModeLabel()}</Badge>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>Storage driver</span>
              <Badge variant={isSupabaseConfigured() ? "success" : "accent"}>
                {isSupabaseConfigured() ? "supabase" : "local demo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>Embedding model / dimension</span>
              <span className="font-mono text-xs">
                {GEMINI_EMBED_MODEL} · {EMBEDDING_DIM}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Retrieval</span>
              <span className="font-mono text-xs">
                top-k {RAG_TOP_K} · floor {RAG_MIN_SIMILARITY}
              </span>
            </div>
            <Alert variant="info" className="mt-2">
              <p className="text-xs">
                Ingestion is a script (<code>scripts/ingest-knowledge.mjs</code>) so documents are only embedded when
                someone runs it — not on every page view.
              </p>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content provenance audit</CardTitle>
          <CardDescription>
            Every career declares where it came from and how much to trust its figures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {careers.slice(0, 8).map((career) => (
            <div key={career.slug} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2 last:border-0">
              <span>{career.title_en}</span>
              <span className="flex items-center gap-2">
                <QualityBadge quality={career.data_quality} locale={locale} />
                <a className="text-xs underline" href={career.source_url} target="_blank" rel="noreferrer noopener">
                  {career.source_org}
                </a>
              </span>
            </div>
          ))}
          <ButtonLink className="inline-block pt-2" href="/admin/careers" size="sm" variant="outline">
              Manage career content
            </ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
}
