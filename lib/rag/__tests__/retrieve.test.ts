import { describe, expect, it } from "vitest";
import { buildDemoProfile } from "@/lib/demo/student";
import { chunkText } from "@/lib/rag/chunk";
import { askCounsellor, mapCitations, profileSummary } from "@/lib/rag/answer";
import { buildLocalIndex, lexicalScore, retrieveKeyword, tokenize } from "@/lib/rag/retrieve";

describe("chunking", () => {
  it("is deterministic", () => {
    const text = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} about vocational training and safety.`).join(" ");
    const a = chunkText(text, { maxChars: 400, overlapChars: 80 });
    const b = chunkText(text, { maxChars: 400, overlapChars: 80 });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(1);
  });

  it("keeps short documents as a single chunk", () => {
    expect(chunkText("A short note about ITI courses.")).toHaveLength(1);
  });

  it("carries overlap between consecutive chunks", () => {
    const text = Array.from({ length: 20 }, (_, i) => `Topic ${i} explains a distinct part of the pathway clearly.`).join(" ");
    const chunks = chunkText(text, { maxChars: 200, overlapChars: 60 });
    const first = chunks[0]!.content.split(" ");
    const lastWordOfFirst = first[first.length - 1]!.toLowerCase();
    expect(chunks[1]!.content.toLowerCase()).toContain(lastWordOfFirst);
  });
});

describe("keyword retrieval", () => {
  it("indexes every seeded document", () => {
    const index = buildLocalIndex();
    expect(index.length).toBeGreaterThanOrEqual(12);
    expect(index.every((chunk) => chunk.content.length > 0)).toBe(true);
  });

  it("finds the continuing-education document for the classic family question", () => {
    const hits = retrieveKeyword("Can my child continue education after ITI?");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.map((hit) => hit.documentId)).toContain("doc-continuing-education-after-iti");
  });

  it("finds the EV pathway document for a battery safety question", () => {
    const hits = retrieveKeyword("Is battery high voltage work dangerous for an EV technician?");
    expect(hits.map((hit) => hit.documentId)).toContain("doc-ev-pathway");
  });

  it("returns nothing rather than a weak guess for unrelated questions", () => {
    expect(retrieveKeyword("best chocolate cake recipe for a birthday")).toEqual([]);
  });

  it("scores identical term sets above disjoint ones", () => {
    const query = tokenize("apprenticeship stipend training");
    expect(lexicalScore(query, tokenize("apprenticeship training stipend contract"))).toBeGreaterThan(
      lexicalScore(query, tokenize("solar panel inverter mounting")),
    );
  });

  it("boosts documents tagged for the requested career", () => {
    const plain = retrieveKeyword("training pathway progression options", { topK: 20 });
    const boosted = retrieveKeyword("training pathway progression options", { topK: 20, careerSlugs: ["ev-technician"] });
    const boostedTop = boosted.findIndex((hit) => hit.documentId === "doc-ev-pathway");
    const plainTop = plain.findIndex((hit) => hit.documentId === "doc-ev-pathway");
    expect(boostedTop).toBeLessThanOrEqual(plainTop);
  });
});

describe("counsellor answers", () => {
  const profile = buildDemoProfile();

  it("answers from the knowledge base when no AI model is configured", async () => {
    const answer = await askCounsellor({
      question: "Can I continue education after an ITI course?",
      profile,
      roleContext: "family",
      locale: "en",
      forceKeywordRetrieval: true,
    });
    expect(answer.mode).toBe("retrieval");
    expect(answer.sources.length).toBeGreaterThan(0);
    expect(answer.answer).toContain("[S1]");
    expect(answer.uncertainty).toContain("assembled from retrieved source text");
  });

  it("refuses instead of guessing when retrieval is empty", async () => {
    const answer = await askCounsellor({
      question: "best chocolate cake recipe for a birthday",
      profile,
      roleContext: "student",
      locale: "en",
      forceKeywordRetrieval: true,
    });
    expect(answer.grounding).toBe("uncertain");
    expect(answer.sources).toEqual([]);
    expect(answer.answer).toMatch(/will not guess/i);
  });

  it("only keeps citations that exist in the retrieved sources", () => {
    const sources = [
      { marker: "S1", title: "a", sourceOrg: "o", sourceUrl: "https://a", retrievedAt: "2026-10-02", dataQuality: "sourced" as const },
      { marker: "S2", title: "b", sourceOrg: "o", sourceUrl: "https://b", retrievedAt: "2026-10-02", dataQuality: "sourced" as const },
    ];
    expect(mapCitations(["S2", "S9"], sources).map((s) => s.marker)).toEqual(["S2"]);
  });

  it("does not leak personal identifiers into the model context", () => {
    const summary = profileSummary(profile, "Rahul");
    expect(summary).toContain("Rahul");
    expect(summary).not.toMatch(/@|phone|\+91/i);
    expect(summary).toContain("Constraints:");
  });

  it("labels illustrative sources honestly in the source list", async () => {
    const answer = await askCounsellor({
      question: "What opportunities are there in Andhra Pradesh districts?",
      profile,
      roleContext: "family",
      locale: "en",
      forceKeywordRetrieval: true,
    });
    const illustrative = answer.sources.filter((source) => source.dataQuality === "illustrative");
    expect(illustrative.length).toBeGreaterThan(0);
  });
});
