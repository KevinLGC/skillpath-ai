import { describe, expect, it } from "vitest";
import { careers, getCareer } from "@/lib/data";
import { buildDemoProfile, DEMO_CONSTRAINTS, DEMO_STUDENT_ID } from "@/lib/demo/student";
import { rankCareers, scoreCareer } from "@/lib/recommendation";
import { DEFAULT_WEIGHTS } from "@/lib/recommendation/weights";
import type { StudentProfile } from "@/lib/types";

const profile = buildDemoProfile();

function withConstraints(overrides: Partial<StudentProfile["constraints"]>): StudentProfile {
  return { ...profile, constraints: { ...DEMO_CONSTRAINTS, ...overrides } };
}

describe("matching engine", () => {
  it("produces a normalized profile from the demo answers", () => {
    expect(profile.interests.machines).toBeGreaterThan(80);
    expect(profile.interests.technology).toBeGreaterThan(80);
    expect(profile.abilities.math).toBeGreaterThan(80);
    expect(profile.preferences.workEnvironments).toContain("workshop");
    expect(profile.coverage).toBeGreaterThan(0.9);
  });

  it("is deterministic: same profile, same order, same scores", () => {
    const a = rankCareers(profile, { now: () => new Date("2026-10-02T00:00:00Z") });
    const b = rankCareers(profile, { now: () => new Date("2026-10-02T00:00:00Z") });
    expect(a.map((r) => r.careerSlug)).toEqual(b.map((r) => r.careerSlug));
    expect(a.map((r) => r.score)).toEqual(b.map((r) => r.score));
  });

  it("round-trips displayed scores (display is rounding, never a different number)", () => {
    for (const rec of rankCareers(profile, { limit: 10 })) {
      expect(rec.score).toBe(Math.round(rec.rawScore * 100));
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(100);
    }
  });

  it("ranks the demo student's EV/machinery pathways highly", () => {
    const top = rankCareers(profile, { limit: 3 }).map((r) => r.careerSlug);
    expect(top).toContain("ev-technician");
    expect(top.some((slug) => ["automotive-service-technician", "cnc-machine-operator", "industrial-electrician"].includes(slug))).toBe(true);
  });

  it("filters out careers whose entry requirement is not met", () => {
    const rankCareersForClass10 = rankCareers({ ...profile, educationLevel: "class10" });
    expect(rankCareersForClass10.every((rec) => rec.eligible)).toBe(true);
    const mechatronics = rankCareersForClass10.find((rec) => rec.careerSlug === "mechatronics-automation-technician");
    expect(mechatronics).toBeUndefined();
  });

  it("explains what-if instead of hiding a career when asked", () => {
    const [rec] = rankCareers(
      { ...profile, educationLevel: "class10" },
      { careerList: [getCareer("mechatronics-automation-technician")!], includeIneligible: true },
    );
    expect(rec?.eligible).toBe(false);
    expect(rec?.ineligibleReasons.join(" ")).toMatch(/entry requirement/i);
  });

  it("excludes unknown factors instead of scoring them as zero", () => {
    const unknownProfile: StudentProfile = {
      ...profile,
      interests: {},
      skills: {},
      abilities: {},
      preferences: { workEnvironments: [], sector: null, team: null, relocation: null },
      constraints: {
        budgetMaxInr: null,
        durationMaxMonths: null,
        minIncomeInr: null,
        state: "",
        district: "",
        hard: [],
      },
    };
    const career = getCareer("ev-technician")!;
    const scored = scoreCareer(unknownProfile, career);
    const unavailable = scored.contributions.filter((c) => !c.available).map((c) => c.factor);
    expect(unavailable).toContain("interest");
    expect(unavailable).toContain("skill");
    expect(unavailable).toContain("aptitude");
    expect(unavailable).toContain("preference");
    expect(unavailable).toContain("constraint");
    expect(scored.confidence).toBeCloseTo(DEFAULT_WEIGHTS.education, 3);
  });

  it("reports lower confidence for a half-answered profile", () => {
    const career = getCareer("ev-technician")!;
    const full = scoreCareer(profile, career);
    const half = scoreCareer({ ...profile, skills: {} }, career);
    expect(half.confidence).toBeLessThan(full.confidence);
  });

  it("honours hard constraints", () => {
    const career = getCareer("ev-technician")!;
    const strict = withConstraints({ budgetMaxInr: 1000, hard: ["budget"] });
    const scored = scoreCareer(strict, career);
    expect(scored.eligible).toBe(false);
    expect(scored.ineligibleReasons.join(" ")).toMatch(/budget/i);
  });

  it("does not penalise a blank budget", () => {
    const career = getCareer("ev-technician")!;
    const blank = withConstraints({ budgetMaxInr: null, hard: [] });
    const constraintContribution = scoreCareer(blank, career).contributions.find((c) => c.factor === "constraint");
    expect(constraintContribution?.available).toBe(true);
    expect(constraintContribution?.score).toBeGreaterThan(0.5);
  });

  it("weights are configurable and versioned", () => {
    const career = getCareer("ev-technician")!;
    const interestHeavy = scoreCareer(profile, career, {
      weights: { ...DEFAULT_WEIGHTS, interest: 0.9, skill: 0.02, aptitude: 0.02, preference: 0.02, education: 0.02, constraint: 0.02 },
    });
    const base = scoreCareer(profile, career);
    expect(interestHeavy.rawScore).not.toBe(base.rawScore);
    expect(base.contributions.reduce((sum, c) => sum + c.weight, 0)).toBeCloseTo(1, 6);
  });

  it("always attaches an explanation with no blank sections for the top match", () => {
    const [top] = rankCareers(profile, { limit: 1 });
    expect(top).toBeDefined();
    expect(top!.explanation.strongAlignment.length).toBeGreaterThan(0);
    expect(top!.explanation.nextSteps.length).toBeGreaterThan(0);
    expect(top!.explanation.confidenceNote).toMatch(/factors/);
  });

  it("stores engine and weights versions on every recommendation", () => {
    for (const rec of rankCareers(profile, { limit: 3 })) {
      expect(rec.engineVersion).toMatch(/^engine-/);
      expect(rec.weightsVersion.length).toBeGreaterThan(0);
      expect(rec.assessmentId).toBe(profile.assessmentId);
    }
  });

  it("scores every seeded career without throwing", () => {
    for (const career of careers) {
      const scored = scoreCareer(profile, career);
      expect(scored.displayScore).toBeGreaterThanOrEqual(0);
      expect(scored.displayScore).toBeLessThanOrEqual(100);
      expect(Number.isFinite(scored.rawScore)).toBe(true);
    }
  });
});
