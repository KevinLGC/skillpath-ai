import Link from "next/link";
import { LocaleSwitcher, ThemeToggle } from "@/components/app/controls";
import { Button } from "@/components/ui/primitives";
import { Disclaimer } from "@/components/ui/misc";
import type { Locale } from "@/lib/types";

export function SiteHeader({ locale, signedIn }: { locale: Locale; signedIn: boolean }) {
  const links = [
    { href: "/how-it-works", label: locale === "te" ? "ఇది ఎలా పనిచేస్తుంది" : "How it works" },
    { href: "/careers", label: locale === "te" ? "వృత్తులు" : "Careers" },
    { href: "/resources", label: locale === "te" ? "వనరులు" : "Resources" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_90%,transparent)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
            SP
          </span>
          <span className="font-semibold">SkillPath AI</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link href={signedIn ? "/dashboard" : "/login"}>
            <Button size="sm">{signedIn ? (locale === "te" ? "డాష్‌బోర్డ్" : "Dashboard") : locale === "te" ? "సైన్ ఇన్" : "Sign in"}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-16 border-t border-[var(--border)] py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-sm text-[var(--muted-foreground)]">
        <p className="font-medium text-[var(--foreground)]">SkillPath AI</p>
        <p className="max-w-3xl">
          {locale === "te"
            ? "SIH 2026 ప్రోటోటైప్ — నైపుణ్యాభివృద్ధి & వ్యవస్థాపకత మంత్రిత్వ శాఖ సమస్య ప్రకటన SIH26241 కోసం నిర్మించబడింది."
            : "SIH 2026 prototype built for Ministry of Skill Development and Entrepreneurship problem statement SIH26241."}
        </p>
        <p className="max-w-3xl">
          {locale === "te"
            ? "ఇక్కడ చూపిన ఫీజులు, జీతాలు, అవకాశాలు ఉదాహరణ డేటా — నిర్ణయం తీసుకునే ముందు అధికారిక పోర్టల్‌లో ధృవీకరించండి."
            : "Fees, salaries and opportunities shown in this prototype are illustrative demo data unless labelled as sourced. Verify with the official portal before deciding."}
        </p>
        <Disclaimer locale={locale} />
      </div>
    </footer>
  );
}
