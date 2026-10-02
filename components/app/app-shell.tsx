import Link from "next/link";
import {
  Bot,
  Briefcase,
  Compass,
  GitCompare,
  LayoutDashboard,
  ListChecks,
  Route,
  Share2,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { LocaleSwitcher, SignOutButton, ThemeToggle } from "@/components/app/controls";
import { Badge } from "@/components/ui/primitives";
import { Disclaimer } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";
import type { Locale, Role, SessionUser } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Compass;
}

function navFor(role: Role, locale: Locale): { section: string; items: NavItem[] }[] {
  const t = (en: string, te: string) => (locale === "te" ? te : en);

  const studentCore: NavItem[] = [
    { href: "/dashboard", label: t("Dashboard", "డాష్‌బోర్డ్"), icon: LayoutDashboard },
    { href: "/assessment", label: t("Assessment", "అసెస్‌మెంట్"), icon: ListChecks },
    { href: "/results", label: t("Results", "ఫలితాలు"), icon: Compass },
    { href: "/roadmap", label: t("Roadmap", "రోడ్‌మ్యాప్"), icon: Route },
    { href: "/skill-gap", label: t("Skill gap", "నైపుణ్య లోటు"), icon: Wrench },
    { href: "/compare", label: t("Compare", "పోల్చడం"), icon: GitCompare },
  ];

  const support: NavItem[] = [
    { href: "/ai-counsellor", label: t("AI counsellor", "ఏఐ కౌన్సెలర్"), icon: Bot },
    { href: "/family", label: t("Family view", "కుటుంబ వీక్షణ"), icon: Share2 },
    { href: "/profile", label: t("Profile", "ప్రొఫైల్"), icon: UserRound },
  ];

  if (role === "counsellor") {
    return [
      {
        section: t("Counsellor", "కౌన్సెలర్"),
        items: [
          { href: "/counsellor", label: t("Student roster", "విద్యార్థుల జాబితా"), icon: Users },
          { href: "/careers", label: t("Career library", "వృత్తి లైబ్రరీ"), icon: Briefcase },
          { href: "/ai-counsellor", label: t("AI counsellor", "ఏఐ కౌన్సెలర్"), icon: Bot },
        ],
      },
    ];
  }

  if (role === "admin") {
    return [
      {
        section: t("Administration", "నిర్వహణ"),
        items: [
          { href: "/admin", label: t("Overview", "సారాంశం"), icon: LayoutDashboard },
          { href: "/admin/careers", label: t("Careers", "వృత్తులు"), icon: Briefcase },
          { href: "/resources", label: t("Knowledge base", "నాలెడ్జ్ బేస్"), icon: ListChecks },
        ],
      },
    ];
  }

  if (role === "family") {
    return [
      {
        section: t("Family view", "కుటుంబ వీక్షణ"),
        items: [
          { href: "/family", label: t("Career plan", "కెరీర్ ప్రణాళిక"), icon: Share2 },
          { href: "/results", label: t("Recommendations", "సూచనలు"), icon: Compass },
          { href: "/compare", label: t("Compare", "పోల్చడం"), icon: GitCompare },
          { href: "/ai-counsellor", label: t("Ask a question", "ప్రశ్న అడగండి"), icon: Bot },
        ],
      },
    ];
  }

  return [
    { section: t("Your career plan", "మీ కెరీర్ ప్రణాళిక"), items: studentCore },
    { section: t("Support", "సహాయం"), items: support },
  ];
}

export function AppShell({
  user,
  locale,
  mode,
  children,
}: {
  user: SessionUser;
  locale: Locale;
  mode: "supabase" | "local-demo";
  children: React.ReactNode;
}) {
  const groups = navFor(user.role, locale);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-0 lg:gap-6 lg:px-6">
      <aside className="hidden w-64 shrink-0 py-6 lg:block">
        <Link href="/" className="mb-6 flex items-center px-2 group">
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
            SkillPath <span className="font-extrabold text-[var(--primary)]">AI</span>
          </span>
        </Link>

        <nav className="space-y-6">
          {groups.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {group.section}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                    >
                      <item.icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 space-y-2 px-2">
          <Badge variant={mode === "supabase" ? "success" : "accent"}>
            {mode === "supabase" ? "Supabase connected" : "Local demo data"}
          </Badge>
          <Disclaimer locale={locale} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_88%,transparent)] px-4 py-3 backdrop-blur lg:px-0">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center lg:hidden">
              <span className="text-base font-bold tracking-tight text-[var(--foreground)]">
                SkillPath <span className="font-extrabold text-[var(--primary)]">AI</span>
              </span>
            </Link>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-sm text-[var(--muted-foreground)]">
                {user.name} · {user.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitcher locale={locale} />
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Sections">
            {groups.flatMap((group) => group.items).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs",
                  "hover:bg-[var(--accent)]",
                )}
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-0 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
