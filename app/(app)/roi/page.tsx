import Link from "next/link";
import { ArrowLeft, Award, FileText, MessageSquareQuote } from "lucide-react";
import { RoiSimulator } from "@/components/family/roi-simulator";
import { Button } from "@/components/ui/primitives";
import { currentLocale } from "@/lib/auth/session";

export const metadata = {
  title: "3-Year Vocational ROI Simulator | SkillPath AI",
  description:
    "Compare 3-year cash flows between general non-technical degrees and NSQF vocational pathways in India with verifiable wage data.",
};

export default async function RoiPage() {
  const locale = await currentLocale();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/family" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <span className="flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                {locale === "te" ? "కుటుంబ కేంద్రం" : "Family Portal"}
              </span>
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {locale === "te"
              ? "3-సంవత్సరాల ఆర్థిక వాస్తవికత & ROI సిమ్యులేటర్"
              : "3-Year Financial Reality & ROI Simulator"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
            {locale === "te"
              ? "సాధారణ బి.ఎ/బి.కాం అప్పు vs ప్రభుత్వ-సబ్సిడీతో కూడిన ఎన్ఎస్ క్యూ ఎఫ్ వృత్తి కోర్సు సంపాదనల స్పష్టమైన పోలిక."
              : "Direct cash flow comparison: General degree tuition debt vs NSQF government-subsidized vocational earnings."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/family">
            <Button variant="outline" size="sm">
              <Award className="h-4 w-4" />
              {locale === "te" ? "విశ్వాస పత్రం" : "Trust Certificate"}
            </Button>
          </Link>
          <Link href="/ai-counsellor">
            <Button variant="outline" size="sm">
              <MessageSquareQuote className="h-4 w-4" />
              {locale === "te" ? "ఏఐ కౌన్సెలర్" : "AI Counsellor"}
            </Button>
          </Link>
        </div>
      </div>

      <RoiSimulator locale={locale} />
    </div>
  );
}
