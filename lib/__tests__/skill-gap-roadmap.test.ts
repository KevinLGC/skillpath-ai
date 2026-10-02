import { describe, expect, it } from "vitest";
import { getCareer } from "@/lib/data";
import { buildDemoProfile } from "@/lib/demo/student";
import { buildRoadmap, roadmapTimeline } from "@/lib/roadmap";
import { computeSkillGap, gapSummary, learningPlan } from "@/lib/skill-gap";
import type { StudentProfile } from "@/lib/types";

const profile = buildDemoProfile();
const ev = getCareer("ev-technician")!;

describe("skill gap", () => {
  it("never treats an unrated skill as a zero", () => {
    const partial: StudentProfile = { ...profile, skills: { electrical: 60 } };
    const gap = computeSkillGap(partial, ev);
    const unrated = gap.find((row) => row.skill === "electronics")!;
    expect(unrated.known).toBe(false);
    expect(unrated.have).toBeNull();
    expect(unrated.gap).toBe(0);
  });

  it("computes real gaps for rated skills", () => {
    const gap = computeSkillGap(profile, ev);
    const electrical = gap.find((row) => row.skill === "electrical")!;
    expect(electrical.known).toBe(true);
    expect(electrical.have).toBe(80);
    expect(electrical.required).toBe(80);
    expect(electrical.gap).toBe(0);
  });

  it("puts priority skills first and excludes unknowns from the learning plan", () => {
    const partial: StudentProfile = { ...profile, skills: { electrical: 20, safety: 90 } };
    const plan = learningPlan(computeSkillGap(partial, ev));
    expect(plan.some((row) => row.skill === "electrical")).toBe(true);
    expect(plan.every((row) => row.known && row.gap > 0)).toBe(true);
  });

  it("summarises gaps without counting unknowns as gaps", () => {
    const partial: StudentProfile = { ...profile, skills: {} };
    const summary = gapSummary(computeSkillGap(partial, ev));
    expect(summary.knownGaps).toBe(0);
    expect(summary.unknown).toBe(ev.skills.length);
  });
});

describe("roadmap", () => {
  it("places a school student at the training stage", () => {
    const { steps, youAreHereIndex } = buildRoadmap(profile, ev);
    expect(steps[youAreHereIndex]?.type).toBe("training");
    expect(steps.filter((s) => s.status === "done")).toHaveLength(youAreHereIndex);
  });

  it("moves the marker forward for a student who already finished training", () => {
    const afterIti = buildRoadmap({ educationLevel: "iti" }, ev);
    expect(afterIti.steps[afterIti.youAreHereIndex]?.type).not.toBe("training");
    expect(afterIti.steps.some((s) => s.type === "training" && s.status === "done")).toBe(true);
  });

  it("carries the career's provenance label onto every step", () => {
    const { steps } = buildRoadmap(profile, ev);
    expect(steps.every((step) => step.data_quality === ev.data_quality)).toBe(true);
  });

  it("builds a year-by-year timeline that skips completed steps", () => {
    const { steps } = buildRoadmap(profile, ev);
    const timeline = roadmapTimeline(steps);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline[0]?.label).toBe("Year 1");
  });
});
