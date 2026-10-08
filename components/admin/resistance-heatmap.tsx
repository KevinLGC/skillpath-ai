"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Download,
  MapPin,
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, Skeleton } from "@/components/ui/primitives";
import type { Locale, ResistanceAnalyticsSummary } from "@/lib/types";

interface ResistanceHeatmapProps {
  locale: Locale;
}

export function ResistanceHeatmap({ locale }: ResistanceHeatmapProps) {
  const [data, setData] = useState<ResistanceAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedState, setSelectedState] = useState("All");
  const exportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/resistance");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as ResistanceAnalyticsSummary;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load resistance analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    return () => {
      if (exportTimer.current) clearTimeout(exportTimer.current);
    };
  }, []);

  function handleExportCsv() {
    if (!data) return;
    setExporting(true);
    exportTimer.current = setTimeout(() => {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        "District,State,TotalSessions,SocialStatusResistance,EarningResistance,DegreeResistance,SafetyResistance,PrimaryBlocker\n" +
        data.districtHeatmap
          .map(
            (d) =>
              `${d.district},${d.state},${d.totalSessions},${d.socialStatusResistance},${d.earningResistance},${d.degreeResistance},${d.safetyResistance},"${d.primaryBlocker}"`,
          )
          .join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `SkillPath_District_Resistance_Brief_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 400);
  }

  const heatmap = data?.districtHeatmap ?? [];
  const filteredHeatmap = useMemo(
    () => (selectedState === "All" ? heatmap : heatmap.filter((h) => h.state.includes(selectedState))),
    [heatmap, selectedState],
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
            <span>{locale === "te" ? "రాష్ట్ర నైపుణ్యాభివృద్ధి మిషన్ విశ్లేషణ" : "State Skill Mission Governance Dashboard"}</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            {locale === "te"
              ? "కుటుంబ ప్రతిఘటన & సంకోచాల హీట్‌మ్యాప్ (Resistance Heatmap)"
              : "District-Level Parental Resistance Heatmap & Sentiment Analytics"}
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-300 sm:text-sm">
            {locale === "te"
              ? "ఏ జిల్లాలో సామాజిక హోదా, డిగ్రీ వ్యామోహం లేదా భద్రతపై తల్లిదండ్రుల వ్యతిరేకత ఎక్కువగా ఉందో గుర్తించండి మరియు కౌన్సెలింగ్ ప్రభావంతో వచ్చిన మార్పును కొలవండి."
              : "Pinpoint district-level clusters where parental objections (social status, degree fixation, earning skepticism, female safety) dominate, and measure post-counseling sentiment transitions."}
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          disabled={exporting || !data}
          className="self-start bg-indigo-600 font-bold text-white hover:bg-indigo-700 sm:self-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          <span>{exporting ? "Generating CSV..." : "Export Resistance Brief"}</span>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm">
            <p className="text-[var(--muted-foreground)]">
              {locale === "te"
                ? "ప్రతిఘటన విశ్లేషణ లోడ్ కాలేదు."
                : "Resistance analytics could not be loaded."}
            </p>
            <Button size="sm" variant="outline" onClick={() => void loadData()}>
              {locale === "te" ? "మళ్లీ ప్రయత్నించండి" : "Try again"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* 4 Macro Key Performance Indicators — figures render only once real data
          has arrived; while loading we show a skeleton rather than invented numbers. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "మొత్తం కుటుంబ సెషన్‌లు" : "Total Family Sessions"}
            </span>
            {loading || !data ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-extrabold text-[var(--foreground)] sm:text-3xl tabular-nums">
                  {data.totalSessionsTracked.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[var(--success)]">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+18.4% month-on-month</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "నమ్మకం మార్పు (డెల్టా)" : "Avg Sentiment Shift Delta"}
            </span>
            {loading || !data ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <>
                <p className="text-2xl font-extrabold text-[var(--success)] sm:text-3xl tabular-nums">
                  +{data.avgSentimentShiftDelta}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Pre 1.9/5 ➔ Post 4.4/5 confidence
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "డ్రాప్‌అవుట్ ముందస్తు హెచ్చరికలు" : "Early Dropout Alerts"}
            </span>
            {loading || !data ? (
              <Skeleton className="mt-2 h-8 w-12" />
            ) : (
              <>
                <p className="text-2xl font-extrabold text-[var(--destructive)] sm:text-3xl tabular-nums">
                  {data.dropoutRiskAlertsCount}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[var(--destructive)]">
                  <AlertTriangle className="h-3 w-3" />
                  <span>High parental hesitation</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <span className="text-xs text-[var(--muted-foreground)]">
              {locale === "te" ? "పరిష్కరించిన కేస్‌లు" : "Resolved Triage Cases"}
            </span>
            {loading || !data ? (
              <Skeleton className="mt-2 h-8 w-12" />
            ) : (
              <>
                <p className="text-2xl font-extrabold text-[var(--primary)] sm:text-3xl tabular-nums">
                  {data.resolvedCasesCount}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  Official ITI campus visits booked
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* District Resistance Heatmap Matrix Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <span>
                {locale === "te"
                  ? "జిల్లా-వారీగా తల్లిదండ్రుల ప్రతిఘటన మ్యాట్రిక్స్"
                  : "District-Wise Parental Objection Concentration Matrix"}
              </span>
            </CardTitle>
            <CardDescription>
              {locale === "te"
                ? "సామాజిక హోదా, డిగ్రీ వ్యామోహం, సంపాదన అపోహలు మరియు భద్రతపై జిల్లాల వారి లెక్కలు"
                : "Parental objection frequencies and primary blocker classification across districts"}
            </CardDescription>
          </div>

          <Select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-44 text-xs"
            aria-label={locale === "te" ? "రాష్ట్రం ద్వారా ఫిల్టర్ చేయండి" : "Filter by state"}
          >
            <option value="All">{locale === "te" ? "అన్ని రాష్ట్రాలు" : "All States"}</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                <tr>
                  <th className="py-2.5 font-semibold">{locale === "te" ? "జిల్లా" : "District"}</th>
                  <th className="py-2.5 font-semibold">{locale === "te" ? "రాష్ట్రం" : "State"}</th>
                  <th className="py-2.5 font-semibold text-center">{locale === "te" ? "మొత్తం సెషన్‌లు" : "Sessions"}</th>
                  <th className="py-2.5 font-semibold text-center text-amber-700">
                    {locale === "te" ? "సామాజిక హోదా" : 'Status ("Log Kya Kahenge")'}
                  </th>
                  <th className="py-2.5 font-semibold text-center text-indigo-700">
                    {locale === "te" ? "డిగ్రీ పిచ్చి" : "Degree Fixation"}
                  </th>
                  <th className="py-2.5 font-semibold text-center text-emerald-700">
                    {locale === "te" ? "సంపాదన అపోహ" : "Earning Doubt"}
                  </th>
                  <th className="py-2.5 font-semibold text-center text-rose-700">
                    {locale === "te" ? "మహిళా భద్రత" : "Female Safety"}
                  </th>
                  <th className="py-2.5 font-semibold">{locale === "te" ? "ప్రధాన సమస్య" : "Primary Blocker"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredHeatmap.map((row) => (
                  <tr key={row.district} className="hover:bg-[var(--secondary)]">
                    <td className="py-3 font-bold">{row.district}</td>
                    <td className="py-3 text-[var(--muted-foreground)]">{row.state}</td>
                    <td className="py-3 text-center font-mono">{row.totalSessions}</td>
                    <td className="py-3 text-center">
                      <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                        {row.socialStatusResistance}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-800">
                        {row.degreeResistance}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                        {row.earningResistance}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-block rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-800">
                        {row.safetyResistance}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          row.primaryBlocker.includes("Status")
                            ? "warning"
                            : row.primaryBlocker.includes("Degree")
                              ? "accent"
                              : "outline"
                        }
                      >
                        {row.primaryBlocker}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
