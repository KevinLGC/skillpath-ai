import Link from "next/link";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/misc";
import { currentLocale } from "@/lib/auth/session";
import { getInterestName, getSkillName } from "@/lib/data";
import { getStudentContext } from "@/lib/queries";
import { createTranslator } from "@/lib/i18n/messages";
import { EDUCATION_LABELS } from "@/lib/types";

export default async function ProfilePage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const context = await getStudentContext();

  if (!context.profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
        <EmptyState
          title={locale === "te" ? "ప్రొఫైల్ ఖాళీగా ఉంది" : "No profile yet"}
          body={
            locale === "te"
              ? "అసెస్‌మెంట్ పూర్తి చేసిన తర్వాత మీ నిర్మిత ప్రొఫైల్ ఇక్కడ కనిపిస్తుంది."
              : "Your structured profile — the exact input the matching engine uses — appears here after the assessment."
          }
          action={
            <Link href="/assessment" className="mt-2 inline-block">
              <Button size="sm">{t("home.hero.cta")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const profile = context.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {locale === "te"
              ? "ఇదే ఇంజిన్ ఇన్‌పుట్ — ఇక్కడ ఏమి ఉందో అదే స్కోర్లలో ఉపయోగించబడుతుంది."
              : "This is the exact input the engine receives. Nothing is scored that is not shown here."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{profile.engineVersion}</Badge>
          <Badge variant="outline">
            {locale === "te" ? "పూర్తి స్థాయి" : "Completeness"} {Math.round(profile.coverage * 100)}%
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.interests")}</CardTitle>
            <CardDescription>
              {locale === "te" ? "0–100 స్కేల్‌లో సాపేక్ష బలం" : "Relative strength on a 0–100 scale"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(profile.interests)
              .sort((a, b) => b[1] - a[1])
              .map(([slug, value]) => (
                <div key={slug}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{getInterestName(slug, locale)}</span>
                    <span className="tabular-nums text-[var(--muted-foreground)]">{value}</span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.abilities")}</CardTitle>
            <CardDescription>
              {locale === "te" ? "సామర్థ్యం & ఆచరణ దృష్టి" : "Aptitude and practical orientation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(profile.abilities)
              .sort((a, b) => b[1] - a[1])
              .map(([slug, value]) => (
                <div key={slug}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{slug}</span>
                    <span className="tabular-nums text-[var(--muted-foreground)]">{value}</span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.skills")}</CardTitle>
            <CardDescription>
              {locale === "te" ? "స్వీయ-రేటింగ్‌లు — లేనివి 'రేటింగ్ లేదు'" : "Self-ratings. Unrated skills stay unrated, never zero."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(profile.skills)
              .sort((a, b) => b[1] - a[1])
              .map(([slug, value]) => (
                <div key={slug}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{getSkillName(slug, locale)}</span>
                    <span className="tabular-nums text-[var(--muted-foreground)]">{value}</span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.preferences")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label={locale === "te" ? "పని ప్రదేశాలు" : "Work environments"}
                value={profile.preferences.workEnvironments.join(", ") || (locale === "te" ? "ఇవ్వలేదు" : "not provided")}
              />
              <Row label={locale === "te" ? "జట్టు" : "Team style"} value={profile.preferences.team ?? (locale === "te" ? "ఇవ్వలేదు" : "not provided")} />
              <Row label={locale === "te" ? "రంగం" : "Employer type"} value={profile.preferences.sector ?? (locale === "te" ? "ఇవ్వలేదు" : "not provided")} />
              <Row
                label={locale === "te" ? "తరలింపు" : "Relocation"}
                value={profile.preferences.relocation ?? (locale === "te" ? "ఇవ్వలేదు" : "not provided")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("profile.constraints")}</CardTitle>
              <CardDescription>
                {locale === "te"
                  ? "ఖాళీ ఫీల్డ్‌లు లెక్కల్లో చేర్చబడవు"
                  : "Blank fields are excluded from scoring rather than guessed."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label={locale === "te" ? "విద్య" : "Education"} value={EDUCATION_LABELS[profile.educationLevel][locale]} />
              <Row
                label={locale === "te" ? "బడ్జెట్" : "Budget cap"}
                value={profile.constraints.budgetMaxInr ? `₹${profile.constraints.budgetMaxInr.toLocaleString("en-IN")}` : "—"}
              />
              <Row
                label={locale === "te" ? "కాలపరిమితి" : "Duration cap"}
                value={profile.constraints.durationMaxMonths ? `${profile.constraints.durationMaxMonths} months` : "—"}
              />
              <Row
                label={locale === "te" ? "కనీస ఆదాయం" : "Minimum income"}
                value={profile.constraints.minIncomeInr ? `₹${profile.constraints.minIncomeInr.toLocaleString("en-IN")}` : "—"}
              />
              <Row label={locale === "te" ? "జిల్లా" : "District"} value={profile.constraints.district || "—"} />
              <Row
                label={locale === "te" ? "కఠిన పరిమితులు" : "Non-negotiable"}
                value={profile.constraints.hard.length > 0 ? profile.constraints.hard.join(", ") : (locale === "te" ? "ఏమీ లేదు" : "none")}
              />
            </CardContent>
          </Card>

          <Alert variant="info" title={locale === "te" ? "మీ డేటా" : "Your data"}>
            <p>
              {locale === "te"
                ? "మీరు సమాధానాలు మార్చగలరు; ప్రతి ఫలితం తిరిగి లెక్కించబడుతుంది. కుటుంబ షేరింగ్ మీ అనుమతితో మాత్రమే, రద్దు చేయగలిగేలా ఉంటుంది."
                : "You can change any answer and re-run the engine. Family sharing happens only with your consent, through expiring links you can revoke. Personal identifiers are never sent to the AI model."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/assessment">
                <Button size="sm" variant="outline">
                  {locale === "te" ? "సమాధానాలు మార్చండి" : "Change my answers"}
                </Button>
              </Link>
              <Link href="/family">
                <Button size="sm" variant="ghost">
                  {locale === "te" ? "షేరింగ్ నిర్వహణ" : "Manage sharing"}
                </Button>
              </Link>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="text-right font-medium capitalize">{value}</span>
    </div>
  );
}
