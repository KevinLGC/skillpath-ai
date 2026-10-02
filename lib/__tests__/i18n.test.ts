import { describe, expect, it } from "vitest";
import { createTranslator, translate } from "@/lib/i18n/messages";
import { pick, usedFallback } from "@/lib/i18n/localize";
import { normalizeLocale } from "@/lib/i18n/config";

describe("i18n", () => {
  it("returns the Telugu string when present", () => {
    expect(translate("te", "nav.dashboard")).toBe("డాష్‌బోర్డ్");
  });

  it("falls back to English instead of a raw key", () => {
    const value = translate("te", "career.jobs");
    expect(value).toBe("Example job roles");
    expect(value).not.toBe("career.jobs");
  });

  it("interpolates variables", () => {
    const t = createTranslator("en");
    expect(t("assessment.progress", { current: 3, total: 24 })).toBe("Question 3 of 24");
  });

  it("leaves unknown placeholders untouched rather than printing undefined", () => {
    expect(translate("en", "assessment.progress", { current: 1 })).toContain("Question 1 of {total}");
  });

  it("localises content with English fallback and reports it", () => {
    expect(pick("Training", "శిక్షణ", "te")).toBe("శిక్షణ");
    expect(pick("Training", "", "te")).toBe("Training");
    expect(usedFallback("Training", "", "te")).toBe(true);
    expect(usedFallback("Training", "శిక్షణ", "te")).toBe(false);
  });

  it("normalises unknown locales to English", () => {
    expect(normalizeLocale("te")).toBe("te");
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });
});
