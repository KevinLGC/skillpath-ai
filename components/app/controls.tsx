"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Languages, Loader2, LogOut, Moon, Sun } from "lucide-react";
import { Button, Select } from "@/components/ui/primitives";
import { LOCALES } from "@/lib/i18n/config";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import type { Locale, Role } from "@/lib/types";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function change(next: string) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <Languages className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
      <span className="sr-only">Language</span>
      <Select
        className="h-8 w-32 text-xs"
        value={locale}
        onChange={(event) => void change(event.target.value)}
        disabled={pending}
      >
        {LOCALES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeLabel}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("sp_theme", next ? "dark" : "light");
    } catch {
      // storage can be unavailable in private modes; the toggle still works
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle colour theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </Button>
  );
}

/** Demo sign-in: four seeded roles so the walkthrough never depends on sign-up. */
export function DemoSignIn() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(accountId: string, role: Role) {
    setBusy(accountId);
    setError(null);
    const response = await fetch("/api/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not sign in");
      setBusy(null);
      return;
    }
    const target = role === "counsellor" ? "/counsellor" : role === "admin" ? "/admin" : "/dashboard";
    router.push(target);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {DEMO_ACCOUNTS.map((account) => (
        <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
          <div>
            <p className="text-sm font-medium">{account.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{account.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void signIn(account.id, account.role)}
            disabled={busy !== null}
          >
            {busy === account.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {account.role === "student" ? "Student" : account.role === "family" ? "Family" : account.role === "counsellor" ? "Counsellor" : "Admin"}
          </Button>
        </div>
      ))}
      {error ? <p className="text-sm text-[var(--destructive)]">{error}</p> : null}
    </div>
  );
}
