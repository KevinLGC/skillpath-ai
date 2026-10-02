"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquarePlus } from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Textarea } from "@/components/ui/primitives";
import type { CounsellorNote, Locale } from "@/lib/types";

/** Counsellor notes: the human review layer over the AI recommendations. */
export function NotesEditor({
  locale,
  studentId,
  recommendationId,
  initialNotes,
}: {
  locale: Locale;
  studentId: string;
  recommendationId: string | null;
  initialNotes: CounsellorNote[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);

  async function save() {
    if (draft.trim().length < 2) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, note: draft.trim(), recommendationId }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string; note?: CounsellorNote };
    setBusy(false);
    if (!response.ok || !body.note) {
      setError(body.error ?? "Could not save the note");
      return;
    }
    setNotes((previous) => [...previous, body.note as CounsellorNote]);
    setDraft("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Counsellor notes</CardTitle>
        <CardDescription>
          {locale === "te"
            ? "మానవ కౌన్సెలర్ వ్యాఖ్యలు — ఏఐ సూచనలపై సమీక్ష."
            : "Notes are attributed to you and sit alongside the engine's recommendation, so the human view is on the record."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {locale === "te" ? "ఇంకా నోట్స్ లేవు." : "No notes yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <p>{note.note}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {note.counsellorId} · {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="note">
            {locale === "te" ? "కొత్త నోట్" : "Add a note"}
          </label>
          <Textarea
            id="note"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              locale === "te"
                ? "ఉదా: విద్యార్థి కుటుంబం ఖర్చుపై ఆందోళన వ్యక్తం చేసింది; ఉచిత షార్ట్-టర్మ్ కోర్సును చర్చించాము."
                : "e.g. Family raised cost concerns; discussed the subsidised short-term course route and the apprenticeship option."
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void save()} disabled={busy || draft.trim().length < 2}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageSquarePlus className="h-4 w-4" aria-hidden />}
              {locale === "te" ? "నోట్ జోడించండి" : "Add note"}
            </Button>
            <Button variant="outline" onClick={() => setReviewed(true)} disabled={reviewed}>
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {locale === "te" ? "సమీక్షించినట్టు గుర్తించండి" : "Mark as reviewed"}
            </Button>
            {reviewed ? <Badge variant="success">{locale === "te" ? "సమీక్షించబడింది" : "Reviewed"}</Badge> : null}
          </div>
          {error ? <Alert variant="danger">{error}</Alert> : null}
        </div>
      </CardContent>
    </Card>
  );
}
