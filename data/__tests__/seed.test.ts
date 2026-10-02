import { describe, expect, it } from "vitest";
import {
  careers,
  checkSeedIntegrity,
  courses,
  documents,
  institutions,
  interests,
  jobs,
  questions,
  schemes,
  skills,
} from "@/lib/data";

describe("seed data", () => {
  it("validates against the schemas", () => {
    expect(careers.length).toBeGreaterThanOrEqual(20);
    expect(questions.length).toBeGreaterThanOrEqual(20);
    expect(skills.length).toBeGreaterThan(0);
    expect(interests).toHaveLength(7);
    expect(institutions.length).toBeGreaterThan(0);
    expect(courses.length).toBeGreaterThan(0);
    expect(jobs.length).toBeGreaterThan(0);
    expect(schemes.length).toBeGreaterThan(0);
    expect(documents.length).toBeGreaterThan(0);
  });

  it("has no referential integrity problems", () => {
    expect(checkSeedIntegrity()).toEqual([]);
  });

  it("covers every interest dimension with at least one career", () => {
    const covered = new Set(careers.flatMap((career) => career.interests.map((i) => i.slug)));
    for (const interest of interests) {
      expect(covered.has(interest.slug)).toBe(true);
    }
  });

  it("labels illustrative figures honestly", () => {
    for (const career of careers) {
      if (career.data_quality === "sourced") {
        expect(career.source_url.startsWith("https://")).toBe(true);
      }
      expect(career.income_band_min).toBeLessThanOrEqual(career.income_band_max);
    }
  });

  it("keeps knowledge-base documents source-linked", () => {
    for (const doc of documents) {
      expect(doc.source_url.startsWith("https://")).toBe(true);
      expect(doc.retrieved_at.length).toBeGreaterThan(0);
      expect(doc.license_note.length).toBeGreaterThan(0);
    }
  });

  it("gives every assessment question a Telugu translation", () => {
    for (const question of questions) {
      expect(question.text_te.trim().length).toBeGreaterThan(0);
      if (question.type !== "scale") {
        expect(question.options?.length ?? 0).toBeGreaterThan(1);
        for (const option of question.options ?? []) {
          expect(option.label_te.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
