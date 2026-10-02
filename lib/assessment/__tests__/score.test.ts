import { describe, expect, it } from "vitest";
import { optionsFor, reverseScore, scoreAssessment } from "@/lib/assessment/score";
import { DEFAULT_SCALE_OPTIONS } from "@/lib/assessment/scale";
import { questions } from "@/lib/data";
import { DEMO_ANSWERS, DEMO_CONSTRAINTS } from "@/lib/demo/student";

const base = {
  educationLevel: "class12" as const,
  constraints: DEMO_CONSTRAINTS,
  assessmentId: "test-assessment",
};

describe("assessment scoring", () => {
  it("injects the shared scale for scale questions", () => {
    const scale = questions.find((q) => q.type === "scale")!;
    expect(optionsFor(scale)).toEqual(DEFAULT_SCALE_OPTIONS);
  });

  it("maps answers onto the 0–100 scale", () => {
    const { profile } = scoreAssessment({ ...base, answers: [{ questionId: "q08", value: "5" }] });
    expect(profile.abilities.math).toBe(100);
  });

  it("inverts reverse-scored items inside the scale range", () => {
    expect(reverseScore(100)).toBe(20);
    expect(reverseScore(20)).toBe(100);
    expect(reverseScore(60)).toBe(60);
  });

  it("is deterministic", () => {
    const a = scoreAssessment({ ...base, answers: DEMO_ANSWERS });
    const b = scoreAssessment({ ...base, answers: DEMO_ANSWERS });
    expect(a.profile).toEqual(b.profile);
  });

  it("excludes skipped questions rather than scoring them zero", () => {
    const { profile, questionScores } = scoreAssessment({
      ...base,
      answers: DEMO_ANSWERS.filter((a) => a.questionId !== "q03"),
    });
    expect(profile.interests.healthcare).toBeUndefined();
    expect(questionScores.some((s) => s.questionId === "q03")).toBe(false);
    expect(profile.coverage).toBeLessThan(1);
  });

  it("keeps skipped preferences as unknown instead of defaulting them", () => {
    const { profile } = scoreAssessment({
      ...base,
      answers: DEMO_ANSWERS.filter((a) => !["q22", "q23", "q24"].includes(a.questionId)),
    });
    expect(profile.preferences.team).toBeNull();
    expect(profile.preferences.sector).toBeNull();
    expect(profile.preferences.relocation).toBeNull();
  });

  it("records multi-choice work environments as a set", () => {
    const { profile } = scoreAssessment({ ...base, answers: DEMO_ANSWERS });
    expect(profile.preferences.workEnvironments).toEqual(["workshop", "field", "outdoor"]);
  });

  it("ignores option values that do not exist for the question", () => {
    const { profile } = scoreAssessment({
      ...base,
      answers: [...DEMO_ANSWERS, { questionId: "q08", value: "not-a-real-option" }],
    });
    expect(profile.abilities.math).toBeUndefined();
  });

  it("counts constraints toward profile coverage", () => {
    const withConstraints = scoreAssessment({ ...base, answers: DEMO_ANSWERS });
    const withoutConstraints = scoreAssessment({
      ...base,
      answers: DEMO_ANSWERS,
      constraints: { ...DEMO_CONSTRAINTS, budgetMaxInr: null, durationMaxMonths: null, minIncomeInr: null, district: "" },
    });
    expect(withConstraints.profile.coverage).toBeGreaterThan(withoutConstraints.profile.coverage);
  });

  it("separates answers received from answers scored", () => {
    const { questionScores, answered } = scoreAssessment({ ...base, answers: DEMO_ANSWERS });
    // 24 answers received; the multi-choice preference question has no single
    // score, so 23 questions produce a numeric score.
    expect(answered).toBe(DEMO_ANSWERS.length);
    expect(questionScores).toHaveLength(23);
    expect(questionScores.every((row) => row.score >= 0 && row.score <= 100)).toBe(true);
  });
});
