"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "@/components/ui/primitives";
import type { Locale } from "@/lib/types";

interface LinkRow {
  id: string;
  token: string;
  expiresAt: string;
  revokedAt: string | null;
  scope: string;
  careerSlugs: string[];
}

/** Family sharing: tokenised, expiring, revocable — and revocable immediately. */
export function SharePanel({
  locale,
  careerSlug,
  careerTitle,
}: {
  locale: Locale;
  careerSlug?: string;
  careerTitle?: string;
}) {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/share", { method: "GET" });
    if (!response.ok) return;
    const body = (await response.json()) as { links: LinkRow[] };
    setLinks(body.links ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careerSlugs: careerSlug ? [careerSlug] : [], scope: "family_view", days }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string; link?: { url: string } };
    if (!response.ok) {
      setError(body.error ?? "Could not create the link");
      setBusy(false);
      return;
    }
    setBusy(false);
    await load();
    if (body.link?.url) {
      await navigator.clipboard?.writeText(body.link.url).catch(() => undefined);
      setCopied(body.link.url);
    }
  }

  async function revoke(id: string) {
    await fetch("/api/share", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  const active = links.filter((link) => !link.revokedAt && new Date(link.expiresAt) > new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4" aria-hidden />
          {locale === "te" ? "కుటుంబంతో పంచుకోండి" : "Share with your family"}
        </CardTitle>
        <CardDescription>
          {locale === "te"
            ? "ఖాతా అవసరం లేదు. లింక్ గడువు ముగుస్తుంది, మీరు ఎప్పుడైనా రద్దు చేయవచ్చు."
            : "No account needed. The link expires, and you can revoke it at any moment — consent is recorded when you create it."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted-foreground)]" htmlFor="share-days">
              {locale === "te" ? "గడువు (రోజులు)" : "Expires in (days)"}
            </label>
            <Select id="share-days" className="h-9 w-28 text-sm" value={String(days)} onChange={(event) => setDays(Number(event.target.value))}>
              {[7, 14, 30, 60, 90].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={() => void create()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
            {locale === "te" ? "లింక్ సృష్టించండి" : "Create share link"}
          </Button>
          {careerTitle ? (
            <Badge variant="outline">
              {locale === "te" ? "షేర్ చేస్తున్నది" : "Sharing"}: {careerTitle}
            </Badge>
          ) : null}
        </div>

        {error ? <Alert variant="danger">{error}</Alert> : null}
        {copied ? (
          <Alert variant="success" title={locale === "te" ? "లింక్ కాపీ అయింది" : "Link copied to clipboard"}>
            <p className="break-all">{copied}</p>
          </Alert>
        ) : null}

        {active.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {locale === "te" ? "సక్రియ లింక్‌లు లేవు." : "No active links yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs">/share/{link.token.slice(0, 12)}…</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {locale === "te" ? "గడువు" : "Expires"} {new Date(link.expiresAt).toLocaleDateString()} · {link.scope}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`${window.location.origin}/share/${link.token}`);
                      setCopied(`${window.location.origin}/share/${link.token}`);
                    }}
                  >
                    <Copy className="h-3 w-3" aria-hidden />
                    {locale === "te" ? "కాపీ" : "Copy"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void revoke(link.id)}>
                    <Trash2 className="h-3 w-3" aria-hidden />
                    {locale === "te" ? "రద్దు" : "Revoke"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
