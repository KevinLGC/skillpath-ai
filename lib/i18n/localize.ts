import type { Locale } from "@/lib/types";

/**
 * Content-level localisation with fallback. Career and course content is stored
 * as `_en` / `_te` pairs; when a Telugu string is missing we fall back to
 * English rather than rendering an empty cell, and the UI marks machine
 * translated content so it is never mistaken for reviewed translation.
 */
export function pick(en: string | null | undefined, te: string | null | undefined, locale: Locale): string {
  if (locale === "te" && te && te.trim().length > 0) return te;
  return en ?? "";
}

/** True when the requested locale had no content and English was substituted. */
export function usedFallback(en: string | null | undefined, te: string | null | undefined, locale: Locale): boolean {
  return locale === "te" && (!te || te.trim().length === 0) && !!en;
}
