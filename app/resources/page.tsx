import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionTitle } from "@/components/ui/primitives";
import { QualityBadge } from "@/components/ui/misc";
import { currentLocale, getSessionUser } from "@/lib/auth/session";
import { documents, schemes } from "@/lib/data";
import { RAG_MIN_SIMILARITY, RAG_TOP_K } from "@/lib/ai/config";
import { createTranslator } from "@/lib/i18n/messages";

export default async function ResourcesPage() {
  const locale = await currentLocale();
  const t = createTranslator(locale);
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} signedIn={Boolean(user)} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{locale === "te" ? "వనరులు & నాలెడ్జ్ బేస్" : "Resources & knowledge base"}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted-foreground)]">
          {locale === "te"
            ? `ఏఐ కౌన్సెలర్ సమాధానాలు ఈ పత్రాల నుండి మాత్రమే తీసుకోబడతాయి (top-k ${RAG_TOP_K}, సారూప్యత పరిమితి ${RAG_MIN_SIMILARITY}).`
            : `The AI counsellor answers only from these documents. Retrieval uses top-${RAG_TOP_K} chunks above a ${RAG_MIN_SIMILARITY} similarity floor, and citations are validated before display.`}
        </p>

        <section className="mt-8">
          <SectionTitle hint={`${documents.length} documents`}>
            {locale === "te" ? "జ్ఞాన పత్రాలు" : "Knowledge documents"}
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <QualityBadge quality={doc.data_quality} locale={locale} />
                    <Badge variant="muted">{doc.locale}</Badge>
                  </div>
                  <CardTitle className="mt-1">{doc.title}</CardTitle>
                  <CardDescription>
                    {doc.source_org} ·{" "}
                    <a className="underline" href={doc.source_url} target="_blank" rel="noreferrer noopener">
                      official source <ExternalLink className="inline h-3 w-3" aria-hidden />
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <p className="line-clamp-4">{doc.content}</p>
                  <p className="text-xs">
                    {locale === "te" ? "సేకరించిన తేదీ" : "Retrieved"} {doc.retrieved_at} · {doc.license_note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <SectionTitle hint={`${schemes.length} schemes`}>
            {locale === "te" ? "ప్రభుత్వ కార్యక్రమాలు" : "Government schemes and frameworks"}
          </SectionTitle>
          <div className="space-y-3">
            {schemes.map((scheme) => (
              <Card key={scheme.slug}>
                <CardHeader>
                  <CardTitle>{locale === "te" ? scheme.name_te : scheme.name_en}</CardTitle>
                  <CardDescription>{scheme.summary_en}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-[var(--muted-foreground)]">
                  <p>
                    <span className="font-medium text-[var(--foreground)]">
                      {locale === "te" ? "అర్హత: " : "Eligibility: "}
                    </span>
                    {scheme.eligibility_en}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">{locale === "te" ? "ప్రయోజనం: " : "Benefit: "}</span>
                    {scheme.benefit_en}
                  </p>
                  <p className="text-xs">
                    {scheme.source_org} · verified {scheme.verified_at} ·{" "}
                    <a className="underline" href={scheme.source_url} target="_blank" rel="noreferrer noopener">
                      official portal
                    </a>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-[var(--border)] p-5">
          <h2 className="text-lg font-semibold">{locale === "te" ? "డేటా విధానం" : "Our data policy"}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted-foreground)]">
            <li>
              {locale === "te"
                ? "ఏఐ సృష్టించిన వాస్తవాలను నాలెడ్జ్ బేస్‌లో చేర్చము."
                : "No AI-generated facts are placed in the knowledge base."}
            </li>
            <li>
              {locale === "te"
                ? "ప్రతి సంఖ్యకు మూల లేబుల్ ఉంటుంది; ఉదాహరణ డేటాను అధికారికంగా చూపము."
                : "Every figure carries a provenance label; demonstration values are never presented as official."}
            </li>
            <li>
              {locale === "te"
                ? "అధికారిక పోర్టల్‌లకు లింకులు ఇస్తాము, తద్వారా మీరు స్వయంగా ధృవీకరించవచ్చు."
                : "Documents link back to the official portals so anyone can verify the original source."}
            </li>
            <li>{t("common.disclaimer")}</li>
          </ul>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
