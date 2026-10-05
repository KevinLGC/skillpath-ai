import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ClipboardList, PhoneCall, Target, Users } from "lucide-react";
import { EscalationTriage } from "@/components/counsellor/escalation-triage";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@/components/ui/primitives";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { getCareer } from "@/lib/data";
import { getCounsellorRoster, getEngagementSummary } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";

export default async function CounsellorRosterPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== "counsellor" && user.role !== "admin")) redirect("/dashboard");

  const locale = await currentLocale();
  const t = createTranslator(locale);
  const [roster, summary] = await Promise.all([getCounsellorRoster(), getEngagementSummary()]);

  const stats = [
    { label: t("counsellorDash.students"), value: summary.students, icon: Users },
    { label: t("counsellorDash.completed"), value: summary.completed, icon: ClipboardList },
    { label: t("counsellorDash.needsReview"), value: summary.needsReview, icon: AlertTriangle },
    { label: locale === "te" ? "కెరీర్ ప్రణాళికలు" : "Career plans created", value: summary.plans, icon: Target },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("counsellorDash.title")}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {locale === "te"
            ? "విద్యార్థుల జాబితా, వారి ఫలితాలు, ఏఐ సూచనలు మరియు మీ నోట్స్."
            : "Assigned students, their assessment status, the engine's recommendations and your notes."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="space-y-1 pt-5">
              <stat.icon className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "te" ? "విద్యార్థులు" : "Students"}</CardTitle>
          <CardDescription>
            {locale === "te"
              ? "మాన్యువల్ డేటా లేదా సుపాబేస్ profiles ఆధారంగా."
              : "Roster comes from the store: seeded demo students locally, profiles.role = 'student' with Supabase."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roster.map((student) => {
            const top = student.topCareer ? getCareer(student.topCareer) : undefined;
            return (
              <div key={student.studentId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                <div className="min-w-0">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {student.educationLevel} · {student.district || "—"}
                    {top ? ` · top match: ${top.title_en}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      student.status === "completed" ? "success" : student.status === "needs_review" ? "warning" : "muted"
                    }
                  >
                    {student.status.replace("_", " ")}
                  </Badge>
                  <Link href={`/counsellor/students/${student.studentId}`}>
                    <Button size="sm" variant="outline">
                      {locale === "te" ? "చూడండి" : "Open"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "te" ? "సమీక్ష ప్రక్రియ" : "Review workflow"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>{locale === "te" ? "1. విద్యార్థి ప్రొఫైల్, ఫ్యాక్టర్ స్కోర్లు చూడండి." : "1. Open a student and review the profile and factor-level scores."}</p>
          <p>{locale === "te" ? "2. సూచనలు సరిపోతాయో లేదో నిర్ణయించండి." : "2. Judge whether the recommended pathways fit the student's constraints."}</p>
          <p>{locale === "te" ? "3. నోట్స్ జోడించి, సమీక్షించినట్టు గుర్తించండి." : "3. Add a note and mark the plan reviewed — it is recorded against your name."}</p>
          <Progress value={(summary.completed / Math.max(1, summary.students)) * 100} tone="success" />
        </CardContent>
      </Card>

      {/* Human Escalation & District ITI Nodal Desk */}
      <div className="space-y-3 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
              <PhoneCall className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {locale === "te" ? "జిల్లా ఐటిఐ నోడల్ ఆఫీసర్ ఎస్కలేషన్ డెస్క్" : "District ITI Nodal Officer Escalation Desk"}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {locale === "te"
              ? "తల్లిదండ్రుల ఆందోళనలు, సామాజిక వ్యతిరేకత ('మిస్త్రీ' స్టిగ్మా, డిగ్రీ వ్యామోహం) మరియు డ్రాపౌట్ రిస్క్ కేస్‌ల తక్షణ పరిష్కారం."
              : "Live triage queue for parental resistance (social stigma, degree fixation, female safety) and ITI nodal callbacks."}
          </p>
        </div>

        <EscalationTriage locale={locale} />
      </div>
    </div>
  );
}
