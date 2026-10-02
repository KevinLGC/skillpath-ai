import type { Locale } from "@/lib/types";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "sp_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "te";
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
