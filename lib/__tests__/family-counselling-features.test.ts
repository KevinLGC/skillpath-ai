import { describe, expect, it } from "vitest";
import { detectParentalObjection, OBJECTION_TAXONOMY } from "@/lib/data/parental-objections";
import { ROI_COMPARISON_DATA } from "@/lib/data/roi";
import { VERIFIED_TRADE_OUTCOMES, VERIFIED_TRAINING_PROVIDERS } from "@/lib/data/trade-outcomes";
import { useLocalStore } from "@/lib/db";

describe("Parental Objection Taxonomy & Detection", () => {
  it("contains all 4 key Indian vocational objection categories", () => {
    const ids = OBJECTION_TAXONOMY.map((item) => item.id);
    expect(ids).toContain("social_status");
    expect(ids).toContain("earning_potential");
    expect(ids).toContain("degree_fixation");
    expect(ids).toContain("female_safety");
  });

  it("detects social status stigma from English and Telugu inputs", () => {
    expect(detectParentalObjection("What will relatives say if he becomes a mistri?")).toBe("social_status");
    expect(detectParentalObjection("ఐటిఐ చేస్తే బంధువుల్లో సమాజంలో గౌరవం ఉంటుందా?")).toBe("social_status");
    expect(detectParentalObjection("Log kya kahenge if my son doesn't go to university?")).toBe("social_status");
  });

  it("detects degree fixation vs vocational ITI", () => {
    expect(detectParentalObjection("Why not just complete a normal BA or BCom degree?")).toBe("degree_fixation");
    expect(detectParentalObjection("సాధారణ డిగ్రీ కాలేజీ కంటే ఇది ఎలా మంచిది?")).toBe("degree_fixation");
  });

  it("detects earning doubts and salary inquiries", () => {
    expect(detectParentalObjection("What is the starting salary and apprenticeship stipend?")).toBe("earning_potential");
    expect(detectParentalObjection("3 ఏళ్ల తర్వాత జీతం మరియు సంపాదన ఎంత వస్తుంది?")).toBe("earning_potential");
  });

  it("detects female safety and workshop suitability", () => {
    expect(detectParentalObjection("Is a workshop environment safe for girls?")).toBe("female_safety");
    expect(detectParentalObjection("వర్క్‌షాప్ శిక్షణ అమ్మాయిలకు సురక్షితమేనా?")).toBe("female_safety");
  });

  it("returns 'general' for queries with no specific objection signal", () => {
    expect(detectParentalObjection("Hello, what courses are available?")).toBe("general");
  });
});

describe("3-Year ROI & Financial Reality Model", () => {
  it("correctly models the net financial advantage of NSQF pathway over BA/BCom", () => {
    const { generalDegree, vocationalPathway } = ROI_COMPARISON_DATA;

    const degreeNet = generalDegree.net3YearPosition; // -₹75,000
    const vocationalNet = vocationalPathway.net3YearPosition; // ₹7,35,000

    expect(degreeNet).toBeLessThan(0);
    expect(vocationalNet).toBeGreaterThan(700000);
    expect(vocationalNet - degreeNet).toBeGreaterThan(800000);
  });

  it("includes legal citations and social protection rights", () => {
    const vocational = ROI_COMPARISON_DATA.vocationalPathway;
    expect(vocational.epfBenefitsAccumulated).toBeGreaterThan(0);
    expect(vocational.lateralEntryDiplomaCreditsEligible).toBe(true);
    expect(vocational.placementRatePercent).toBeGreaterThan(80);
  });
});

describe("Trade Outcomes & Trust Credentials", () => {
  it("provides comprehensive data for all verified trade tracks", () => {
    expect(VERIFIED_TRADE_OUTCOMES.length).toBeGreaterThanOrEqual(4);

    for (const trade of VERIFIED_TRADE_OUTCOMES) {
      expect(trade.id).toBeDefined();
      expect(trade.nameEn).toBeDefined();
      expect(trade.placementRate).toBeGreaterThanOrEqual(75);
      expect(trade.avg3YearSalary).toBeGreaterThan(trade.avgStartingSalary);
      expect(trade.nsqfProgression.length).toBeGreaterThanOrEqual(3);
      expect(trade.parentRebuttal.statusMyth.en).toBeDefined();
      expect(trade.roleModel.name).toBeDefined();
    }
  });

  it("has verified training providers across AP and national ITIs", () => {
    expect(VERIFIED_TRAINING_PROVIDERS.length).toBeGreaterThanOrEqual(4);
    const vsp = VERIFIED_TRAINING_PROVIDERS.find((p) => p.district === "Visakhapatnam");
    expect(vsp).toBeDefined();
    expect(vsp?.type).toContain("Govt");
  });
});

describe("Human Escalation Desk & Resistance Telemetry", () => {
  it("supports creating and updating escalation cases in store", async () => {
    const store = useLocalStore();

    const created = await store.createEscalationCase({
      studentName: "Test Student",
      parentName: "Test Parent",
      parentPhone: "9876543210",
      district: "Visakhapatnam",
      state: "Andhra Pradesh",
      primaryObjection: "social_status",
      tradeInterest: "Electrician",
      parentNotes: "Worried about status",
      preferredLanguage: "te",
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe("Pending");

    const cases = await store.listEscalationCases();
    expect(cases.some((c) => c.id === created.id)).toBe(true);

    const updated = await store.updateEscalationCase(created.id, {
      status: "In Progress",
      counsellorNotes: "Spoke with father, explained NCVT certification.",
    });

    expect(updated?.status).toBe("In Progress");
    expect(updated?.counsellorNotes).toContain("NCVT");
  });

  it("records resistance sessions and compiles district telemetry", async () => {
    const store = useLocalStore();

    await store.recordResistanceSession({
      district: "Visakhapatnam",
      state: "Andhra Pradesh",
      primaryObjection: "social_status",
      trade: "Electrician",
    });

    const analytics = await store.getResistanceAnalytics();
    expect(analytics.totalSessionsTracked).toBeGreaterThan(0);
    expect(analytics.districtHeatmap.length).toBeGreaterThan(0);

    const vsp = analytics.districtHeatmap.find((d) => d.district === "Visakhapatnam");
    expect(vsp).toBeDefined();
    expect(vsp?.socialStatusResistance).toBeGreaterThan(0);
  });
});
