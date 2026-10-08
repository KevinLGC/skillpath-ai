"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PhoneCall, Search } from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, Textarea } from "@/components/ui/primitives";
import { useDialog } from "@/lib/hooks/use-dialog";
import { formatDate } from "@/lib/utils/format";
import type { EscalationCase, Locale } from "@/lib/types";

interface EscalationTriageProps {
  locale: Locale;
}

export function EscalationTriage({ locale }: EscalationTriageProps) {
  const [cases, setCases] = useState<EscalationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterDistrict, setFilterDistrict] = useState<string>("All");
  const [search, setSearch] = useState("");

  const [activeCase, setActiveCase] = useState<EscalationCase | null>(null);
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState<EscalationCase["status"]>("In Progress");
  const [postScore, setPostScore] = useState<number>(4);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setActiveCase(null);
    setNewNote("");
  }, []);
  const dialogRef = useDialog<HTMLDivElement>(activeCase !== null, closeModal);

  async function loadCases() {
    try {
      setLoading(true);
      const res = await fetch("/api/counsellor/cases");
      if (res.ok) {
        const data = (await res.json()) as { cases: EscalationCase[] };
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCases();
  }, []);

  async function handleUpdateCase() {
    if (!activeCase) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/counsellor/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeCase.id,
          status: newStatus,
          counsellorNotes: newNote || activeCase.counsellorNotes,
          postSentimentScore: newStatus === "Resolved" ? 5 : postScore,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not save this case. Try again.");
        return;
      }
      closeModal();
      await loadCases();
    } catch {
      setError("Network problem — the case was not saved. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (filterStatus !== "All" && c.status !== filterStatus) return false;
      if (filterDistrict !== "All" && !c.district.toLowerCase().includes(filterDistrict.toLowerCase())) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.studentName.toLowerCase().includes(q) ||
          c.parentName.toLowerCase().includes(q) ||
          c.parentPhone.includes(q) ||
          c.district.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cases, filterStatus, filterDistrict, search]);

  const { pendingCount, highRiskCount, resolvedCount } = useMemo(
    () => ({
      pendingCount: cases.filter((c) => c.status === "Pending").length,
      highRiskCount: cases.filter((c) => c.dropoutRiskLevel === "High" && c.status !== "Resolved").length,
      resolvedCount: cases.filter((c) => c.status === "Resolved").length,
    }),
    [cases],
  );

  return (
    <div className="space-y-6">
      {/* KPI Highlights */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "మొత్తం కేస్‌లు" : "Total Escalations"}
            </span>
            <p className="text-2xl font-extrabold text-[var(--foreground)]">{cases.length}</p>
            <span className="text-[11px] text-[var(--muted-foreground)]">Active counseling queue</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "పెండింగ్ కాల్స్" : "Pending Callback"}
            </span>
            <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
            <span className="text-[11px] text-amber-700">Needs nodal officer touch</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "తీవ్ర వ్యతిరేకత (హై రిస్క్)" : "High Resistance Alerts"}
            </span>
            <p className="text-2xl font-extrabold text-rose-600">{highRiskCount}</p>
            <span className="text-[11px] text-rose-700">Immediate dropout risk</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "సమస్య పరిష్కారం" : "Resolved Consensus"}
            </span>
            <p className="text-2xl font-extrabold text-emerald-600">{resolvedCount}</p>
            <span className="text-[11px] text-emerald-700">Enrolled / Confirmed visit</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "te" ? "పేరు, ఫోన్ లేదా జిల్లా ద్వారా వెతకండి..." : "Search by student, parent, or phone..."}
              className="max-w-xs text-xs"
              aria-label={locale === "te" ? "కేస్‌లను వెతకండి" : "Search cases"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs"
              aria-label={locale === "te" ? "స్థితి ద్వారా ఫిల్టర్ చేయండి" : "Filter by status"}
            >
              <option value="All">{locale === "te" ? "అన్ని స్థితులు" : "All Statuses"}</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </Select>

            <Select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="text-xs"
              aria-label={locale === "te" ? "జిల్లా ద్వారా ఫిల్టర్ చేయండి" : "Filter by district"}
            >
              <option value="All">{locale === "te" ? "అన్ని జిల్లాలు" : "All Districts"}</option>
              <option value="Visakhapatnam">Visakhapatnam</option>
              <option value="Vijayawada">Vijayawada</option>
              <option value="Guntur">Guntur</option>
              <option value="Tirupati">Tirupati</option>
              <option value="Kurnool">Kurnool</option>
              <option value="Lucknow">Lucknow</option>
              <option value="Pune">Pune</option>
            </Select>

            <Button size="sm" variant="outline" onClick={loadCases}>
              {locale === "te" ? "రిఫ్రెష్" : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Triage Cases Table / List */}
      <div className="space-y-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            {locale === "te" ? "కేస్‌లు లోడ్ అవుతున్నాయి..." : "Loading triage queue..."}
          </p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              {locale === "te" ? "ఎటువంటి కేస్‌లు దొరకలేదు." : "No escalation cases matching current filters."}
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--muted-foreground)]">{item.id}</span>
                    <Badge
                      variant={
                        item.status === "Resolved"
                          ? "success"
                          : item.status === "In Progress"
                            ? "accent"
                            : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                    <Badge
                      variant={
                        item.dropoutRiskLevel === "High"
                          ? "warning"
                          : item.dropoutRiskLevel === "Medium"
                            ? "muted"
                            : "outline"
                      }
                    >
                      Risk: {item.dropoutRiskLevel}
                    </Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-base font-bold text-[var(--foreground)]">
                    {item.studentName} ·{" "}
                    <span className="text-sm font-normal text-[var(--muted-foreground)]">
                      Parent: {item.parentName}
                    </span>
                  </p>

                  <p className="text-xs text-[var(--muted-foreground)]">
                    <strong className="text-[var(--foreground)]">{item.district}, {item.state}</strong> · Trade:{" "}
                    <span className="font-semibold text-amber-700">{item.tradeInterest}</span> · Primary Objection:{" "}
                    <span className="capitalize text-rose-700">{item.primaryObjection.replace("_", " ")}</span>
                  </p>

                  {item.parentNotes ? (
                    <p className="rounded-lg bg-[var(--secondary)] p-2 text-xs italic text-[var(--foreground)]">
                      &ldquo;{item.parentNotes}&rdquo;
                    </p>
                  ) : null}

                  {item.counsellorNotes ? (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      <strong>Counsellor Notes:</strong> {item.counsellorNotes}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <a
                    href={`tel:${item.parentPhone}`}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--accent)]"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{item.parentPhone}</span>
                  </a>

                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveCase(item);
                      setNewStatus(item.status);
                      setNewNote(item.counsellorNotes || "");
                      setPostScore(item.postSentimentScore || 4);
                    }}
                  >
                    {locale === "te" ? "కేస్ అప్‌డేట్" : "Take Action"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal / Action Drawer for Case Update */}
      {activeCase ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !updating) closeModal();
          }}
        >
          <Card
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-dialog-title"
            tabIndex={-1}
            className="w-full max-w-lg shadow-2xl outline-none"
          >
            <CardHeader>
              <CardTitle id="case-dialog-title" className="flex items-center justify-between text-base">
                <span>Update Triage Case: {activeCase.id}</span>
                <Badge variant="outline">{activeCase.studentName}</Badge>
              </CardTitle>
              <CardDescription>
                Assigned Center: {activeCase.assignedCenter} ({activeCase.assignedOfficer})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold" htmlFor="case-status">
                  Case Status:
                </label>
                <Select
                  id="case-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as EscalationCase["status"])}
                  className="text-xs"
                >
                  <option value="Pending">Pending Outreach</option>
                  <option value="In Progress">In Progress (Outreach / Campus Visit Scheduled)</option>
                  <option value="Resolved">Resolved (Parent Consented / Enrolled)</option>
                </Select>
              </div>

              <div>
                <label className="mb-1 block font-semibold" htmlFor="case-notes">
                  Counsellor Call Outreach Notes:
                </label>
                <Textarea
                  id="case-notes"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record what was discussed with parent (e.g. explained Tata Power wages, shared ITI hostel video, scheduled campus visit)..."
                  className="text-xs min-h-[90px]"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold" htmlFor="case-sentiment">
                  Post-Counselling Parental Sentiment (1 = Skeptical, 5 = Enthusiastic):
                </label>
                <Select
                  id="case-sentiment"
                  value={String(postScore)}
                  onChange={(e) => setPostScore(Number(e.target.value))}
                  className="text-xs"
                >
                  <option value="1">1 - Highly Resistant</option>
                  <option value="2">2 - Hesitant</option>
                  <option value="3">3 - Neutral / Undecided</option>
                  <option value="4">4 - Reassured & Supportive</option>
                  <option value="5">5 - Fully Committed / Enrolled</option>
                </Select>
              </div>

              {error ? (
                <Alert variant="danger">
                  <p>{error}</p>
                </Alert>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={closeModal} disabled={updating}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdateCase} disabled={updating}>
                  {updating ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
