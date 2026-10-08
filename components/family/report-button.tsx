"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Link2, Loader2, Printer } from "lucide-react";
import { Alert, Button, ButtonAnchor, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import type { Locale } from "@/lib/types";

/**
 * Generates the immutable Family Career Decision Report snapshot, optionally
 * publishing it behind a fresh share token for the family.
 */
export function ReportGenerator({
  locale,
  careerSlug,
  careerTitle,
}: {
  locale: Locale;
  careerSlug: string;
  careerTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ reportId: string; shareUrl: string | null } | null>(null);

  async function generate(shareWithFamily: boolean) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerSlug, shareWithFamily, locale }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        detail?: string;
        reportId?: string;
        shareUrl?: string | null;
      };
      if (!response.ok || !body.reportId) {
        setError(body.detail ?? body.error ?? "Could not generate the report.");
        return;
      }
      setResult({ reportId: body.reportId, shareUrl: body.shareUrl ?? null });
      router.refresh();
    } catch {
      setError("Network problem — the report was not generated. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" aria-hidden />
          {locale === "te" ? "కుటుంబ నిర్ణయ నివేదిక" : "Family career decision report"}
        </CardTitle>
        <CardDescription>
          {locale === "te"
            ? `${careerTitle} కోసం స్కోరు, కారణాలు, ఖర్చులు, కాలక్రమం, నైపుణ్య లోటు మరియు మూలాలతో ఒక పత్రం.`
            : `One document for ${careerTitle}: the score and its factors, costs, timeline, skill gaps, further education and sources.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void generate(false)} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
            {locale === "te" ? "నివేదిక తయారు చేయండి" : "Generate report"}
          </Button>
          <Button variant="outline" onClick={() => void generate(true)} disabled={busy}>
            <Link2 className="h-4 w-4" aria-hidden />
            {locale === "te" ? "లింక్‌తో తయారు చేయండి" : "Generate + share link"}
          </Button>
        </div>

        {error ? <Alert variant="danger">{error}</Alert> : null}

        {result ? (
          <Alert variant="success" title={locale === "te" ? "నివేదిక సిద్ధమైంది" : "Report generated"}>
            <div className="flex flex-wrap gap-2 pt-2">
              <ButtonAnchor href={`/report/${result.reportId}`} target="_blank" rel="noreferrer" size="sm" variant="outline">
                <Printer className="h-3 w-3" aria-hidden />
                {locale === "te" ? "నివేదిక తెరవండి / ప్రింట్" : "Open / print report"}
              </ButtonAnchor>
              {result.shareUrl ? (
                <ButtonAnchor href={result.shareUrl} target="_blank" rel="noreferrer" size="sm" variant="ghost">
                  {locale === "te" ? "కుటుంబ లింక్" : "Family link"}
                </ButtonAnchor>
              ) : null}
            </div>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
