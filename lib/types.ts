/**
 * SkillPath AI — domain types.
 *
 * These types are the contract between the seed data, the matching engine,
 * the AI layer and the UI. Everything the engine consumes is structured data:
 * no LLM ever produces a score, a percentage or a career recommendation.
 */

export type Locale = "en" | "te";

export type Role = "student" | "family" | "counsellor" | "admin";

/** Education levels in ascending order. Index = rank. */
export const EDUCATION_LEVELS = [
  "class8",
  "class10",
  "class12",
  "iti",
  "diploma",
  "graduate",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EDUCATION_LABELS: Record<EducationLevel, { en: string; te: string }> = {
  class8: { en: "Class 8", te: "8వ తరగతి" },
  class10: { en: "Class 10", te: "10వ తరగతి" },
  class12: { en: "Class 12", te: "12వ తరగతి" },
  iti: { en: "ITI / Trade certificate", te: "ఐటీఐ / ట్రేడ్ సర్టిఫికెట్" },
  diploma: { en: "Diploma", te: "డిప్లొమా" },
  graduate: { en: "Graduate", te: "గ్రాడ్యుయేట్" },
};

export function educationRank(level: EducationLevel): number {
  return EDUCATION_LEVELS.indexOf(level);
}

/**
 * Provenance label. This is a first-class part of the product: the plan
 * requires sourced facts, estimates and demo figures to be visually distinct.
 */
export type DataQuality = "sourced" | "estimated" | "illustrative" | "guidance";

export type WorkEnvironment =
  | "workshop"
  | "factory"
  | "field"
  | "site"
  | "lab"
  | "healthcare"
  | "office"
  | "studio"
  | "outdoor"
  | "hospitality";

export type CostBand = "low" | "medium" | "high";
export type RelocationLikelihood = "low" | "medium" | "high";
export type EntrepreneurshipPotential = "limited" | "possible" | "strong";
export type Sector = "government" | "private" | "entrepreneurship";
export type TeamPreference = "individual" | "team" | "either";

/** Interest dimensions from the problem statement (§3 of the plan). */
export interface Interest {
  slug: string;
  name_en: string;
  name_te: string;
  description_en: string;
}

export interface Skill {
  slug: string;
  name_en: string;
  name_te: string;
  category: "technical" | "digital" | "people" | "safety" | "business";
}

export interface CareerSkillRequirement {
  slug: string;
  /** Required proficiency, 0–100. */
  level: number;
  /** Gap-priority skills are shown first in the learning plan. */
  priority: boolean;
}

export interface CareerInterestWeight {
  slug: string;
  /** Importance of this interest for the career, 0–1. */
  weight: number;
}

/** Aptitude intensities required by the career, each 0–100. */
export interface CareerFactors {
  math: number;
  logical: number;
  mechanical: number;
  creativity: number;
  communication: number;
  practical: number;
}

export type PathwayStageType =
  | "training"
  | "certification"
  | "apprenticeship"
  | "employment"
  | "progression"
  | "further_education";

export interface CareerPathwayStage {
  stage: number;
  type: PathwayStageType;
  title_en: string;
  title_te: string;
  duration_months: number | null;
  /** Free-text note. Any figure here is labelled with data_quality at career level. */
  note_en: string;
  /** true when the stage is optional or conditional (e.g. further education). */
  optional: boolean;
}

export interface Career {
  slug: string;
  title_en: string;
  title_te: string;
  summary_en: string;
  summary_te: string;
  /** What the work actually looks like day to day. */
  work_en: string;
  work_environment: WorkEnvironment;
  sector_fit: Sector[];
  team_orientation: TeamPreference;
  min_education_level: EducationLevel;
  duration_months_min: number;
  duration_months_max: number;
  cost_band: CostBand;
  relocation_likelihood: RelocationLikelihood;
  entrepreneurship: EntrepreneurshipPotential;
  /** Illustrative monthly starting range in INR. Never presented as a guarantee. */
  income_band_min: number;
  income_band_max: number;
  factors: CareerFactors;
  skills: CareerSkillRequirement[];
  interests: CareerInterestWeight[];
  pathways: CareerPathwayStage[];
  further_education_en: string[];
  considerations_en: string[];
  opportunities_en: string[];
  /** Districts/states where seeded opportunities exist (drives local matching). */
  availability: { state: string; districts: string[] }[];
  source_org: string;
  source_url: string;
  data_quality: DataQuality;
}

export interface Institution {
  slug: string;
  name: string;
  kind: "government_iti" | "private_iti" | "polytechnic" | "training_centre" | "skill_centre";
  state: string;
  district: string;
  address: string;
  website: string | null;
  source_url: string;
  data_quality: DataQuality;
}

export interface Course {
  slug: string;
  institution_slug: string;
  career_slug: string;
  title_en: string;
  title_te: string;
  duration_months: number;
  /** Total course fee in INR — illustrative unless data_quality is "sourced". */
  cost_inr: number;
  mode: "residential" | "non_residential" | "online" | "blended";
  eligibility_en: string;
  source_url: string;
  data_quality: DataQuality;
}

export interface JobOpportunity {
  slug: string;
  career_slug: string;
  role_title_en: string;
  role_title_te: string;
  salary_min_inr: number;
  salary_max_inr: number;
  salary_period: "month";
  region: string;
  employer_type: Sector;
  source_url: string;
  data_quality: DataQuality;
}

export interface GovernmentScheme {
  slug: string;
  name_en: string;
  name_te: string;
  summary_en: string;
  eligibility_en: string;
  benefit_en: string;
  source_org: string;
  source_url: string;
  verified_at: string;
}

export interface LocalOpportunity {
  career_slug: string;
  state: string;
  district: string;
  kind: "institution" | "course" | "apprenticeship" | "job" | "training_centre";
  label_en: string;
  detail_en: string;
}

/* ---------------------------------- assessment ---------------------------------- */

export type QuestionDimension =
  | "interest"
  | "aptitude"
  | "skill"
  | "practical"
  | "preference"
  | "constraint";

export interface QuestionOption {
  value: string;
  label_en: string;
  label_te: string;
  /** 0–100 score contribution for scale-like option sets. */
  score: number;
}

export interface AssessmentQuestion {
  id: string;
  code: string;
  dimension: QuestionDimension;
  /** Which profile key this question feeds (interest slug, ability key, base skill slug…). */
  target: string;
  /**
   * "scale" questions use the shared 5-point scale from lib/assessment/scale.ts,
   * so the seed does not repeat the same five options 20 times.
   */
  type: "scale" | "single" | "multi";
  text_en: string;
  text_te: string;
  helper_en?: string;
  /** Present for "single"/"multi" questions; injected for "scale". */
  options?: QuestionOption[];
  /** Reverse-scored items are inverted during normalization. */
  reverse: boolean;
  /** Relative importance inside its dimension. */
  weight: number;
  order: number;
}

export interface StudentConstraints {
  budgetMaxInr: number | null;
  durationMaxMonths: number | null;
  minIncomeInr: number | null;
  state: string;
  district: string;
  /** Constraints the student marks as non-negotiable become hard filters. */
  hard: ("budget" | "duration" | "income" | "location")[];
}

/**
 * Preferences are nullable on purpose: a skipped question is "unknown" and is
 * excluded from scoring rather than silently defaulted to a value that would
 * inflate the preference factor.
 */
export interface StudentPreferences {
  workEnvironments: WorkEnvironment[];
  sector: Sector | "any" | null;
  team: TeamPreference | null;
  relocation: "willing" | "not_willing" | "maybe" | null;
}

/** The normalized student profile — the single input to the matching engine. */
export interface StudentProfile {
  assessmentId: string;
  educationLevel: EducationLevel;
  interests: Record<string, number>;
  abilities: Record<string, number>;
  skills: Record<string, number>;
  preferences: StudentPreferences;
  constraints: StudentConstraints;
  /** 0–1: share of engine inputs the student actually answered. */
  coverage: number;
  engineVersion: string;
}

/* ---------------------------------- matching ---------------------------------- */

export interface FactorScores {
  interest: number;
  skill: number;
  aptitude: number;
  preference: number;
  education: number;
  constraint: number;
}

export type FactorKey = keyof FactorScores;

export interface FactorContribution {
  factor: FactorKey;
  /** Normalized factor score, 0–1. */
  score: number;
  weight: number;
  /** score × weight — what actually lands in the total. */
  contribution: number;
  /** false when the student gave no data for this factor (excluded from denominator). */
  available: boolean;
  detail: string;
}

export interface MatchExplanation {
  strongAlignment: string[];
  considerations: string[];
  skillsToImprove: string[];
  nextSteps: string[];
  confidenceNote: string;
}

export interface SkillGapRow {
  skill: string;
  name_en: string;
  /** null when the student did not self-rate this skill — shown as "not rated", never as 0. */
  have: number | null;
  required: number;
  gap: number;
  /** false when there is no self-rating to compare against. */
  known: boolean;
  priority: boolean;
}

export interface Recommendation {
  id: string;
  studentId: string;
  assessmentId: string;
  careerSlug: string;
  /** Integer 0–100, for display only. */
  score: number;
  /** Raw score before display rounding — used by tests to prove round-trip. */
  rawScore: number;
  confidence: number;
  factors: FactorScores;
  contributions: FactorContribution[];
  explanation: MatchExplanation;
  skillGap: SkillGapRow[];
  eligible: boolean;
  /** Plain-language reasons the career was filtered out, shown in "why not" UI. */
  ineligibleReasons: string[];
  engineVersion: string;
  weightsVersion: string;
  createdAt: string;
}

export interface RoadmapStep {
  stage: number;
  type: PathwayStageType;
  title_en: string;
  title_te: string;
  duration_months: number | null;
  note_en: string;
  optional: boolean;
  status: "done" | "current" | "upcoming";
  data_quality: DataQuality;
}

export interface Roadmap {
  id: string;
  studentId: string;
  careerSlug: string;
  createdAt: string;
  steps: RoadmapStep[];
  /** Index of the step the student is currently on ("you are here"). */
  youAreHereIndex: number;
}

/* ------------------------------------ RAG ------------------------------------ */

export interface KnowledgeDocument {
  id: string;
  title: string;
  source_org: string;
  source_url: string;
  retrieved_at: string;
  license_note: string;
  locale: Locale | "multi";
  data_quality: DataQuality;
  /** Career slugs the document is relevant to (used for boosting). */
  career_slugs: string[];
  content: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  embedding_model: string | null;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  title: string;
  sourceOrg: string;
  sourceUrl: string;
  retrievedAt: string;
  dataQuality: DataQuality;
  content: string;
  similarity: number;
  /** Which retrieval method produced the hit (hybrid search transparency). */
  via: "vector" | "keyword";
}

export interface AnswerSource {
  marker: string;
  title: string;
  sourceOrg: string;
  sourceUrl: string;
  retrievedAt: string;
  dataQuality: DataQuality;
}

export type GroundingLevel = "sourced" | "estimated" | "guidance" | "uncertain";

export interface CounsellorAnswer {
  answer: string;
  grounding: GroundingLevel;
  sources: AnswerSource[];
  uncertainty: string | null;
  /** llm = grounded generation, retrieval = deterministic extractive fallback. */
  mode: "llm" | "retrieval";
  model: string | null;
  latencyMs: number;
}

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  grounding: GroundingLevel | null;
  sources: AnswerSource[];
  mode: "llm" | "retrieval" | null;
  createdAt: string;
}

export interface ChatSessionRecord {
  id: string;
  userId: string;
  studentId: string | null;
  roleContext: "student" | "family" | "counsellor";
  locale: Locale;
  createdAt: string;
}

/* ------------------------------- family / sharing ------------------------------- */

export interface ShareLink {
  id: string;
  token: string;
  studentId: string;
  careerSlugs: string[];
  scope: "family_view" | "report" | "full";
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface ConsentRecord {
  id: string;
  studentId: string;
  grantedBy: string;
  kind: "family_sharing" | "data_processing";
  grantedAt: string;
  revokedAt: string | null;
}

export interface DecisionReport {
  id: string;
  studentId: string;
  careerSlug: string;
  locale: Locale;
  createdAt: string;
  snapshot: {
    studentName: string;
    educationLevel: EducationLevel;
    district: string;
    careerTitle: string;
    summary: string;
    score: number;
    factors: FactorContribution[];
    explanation: MatchExplanation;
    skillGap: SkillGapRow[];
    pathway: CareerPathwayStage[];
    costs: { label: string; amountInr: number; quality: DataQuality }[];
    timeline: { year: string; label: string; quality: DataQuality }[];
    furtherEducation: string[];
    considerations: string[];
    sources: AnswerSource[];
    disclaimer: string;
  };
}

/* ---------------------------------- counsellor ---------------------------------- */

export interface CounsellorNote {
  id: string;
  counsellorId: string;
  studentId: string;
  recommendationId: string | null;
  note: string;
  createdAt: string;
}

export interface StudentOverview {
  studentId: string;
  name: string;
  educationLevel: EducationLevel;
  district: string;
  status: "not_started" | "assessment_pending" | "completed" | "needs_review";
  assessmentDate: string | null;
  topCareer: string | null;
}

/* ------------------------------------ app ------------------------------------ */

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  email: string | null;
  locale: Locale;
  /** Demo sessions are cookie-based; real sessions come from Supabase Auth. */
  kind: "demo" | "supabase";
}

export interface EngineConfig {
  version: string;
  weights: FactorScores;
  /** Similarity floor for RAG retrieval. */
  ragMinSimilarity: number;
  ragTopK: number;
}

export interface StoreUsage {
  userId: string;
  day: string;
  count: number;
}

/* ----------------------------- joint family & objections ----------------------------- */

export type PerspectiveMode = "joint" | "parent" | "learner";

export type ParentalObjectionType =
  | "social_status"
  | "earning_potential"
  | "degree_fixation"
  | "female_safety"
  | "general";

export interface TrainingProvider {
  id: string;
  name: string;
  type: "Govt ITI" | "PMKK (Pradhan Mantri Kaushal Kendra)" | "NSTI Central Institute";
  state: string;
  district: string;
  address: string;
  nodalOfficer: string;
  phone: string;
  hostelAvailable: boolean;
  placementRate: number;
  tradesOffered: string[];
}

export interface TradeProgressionStep {
  level: number;
  title: string;
  experience: string;
  avgSalary: string;
  roleDescription: string;
}

export interface TradeOutcomeData {
  id: string;
  nameEn: string;
  nameTe: string;
  nameHi: string;
  sectorEn: string;
  sectorTe: string;
  sectorHi: string;
  nsqfLevel: number;
  placementRate: number;
  sampleSize: number;
  entrySalaryMin: number;
  entrySalaryMax: number;
  avgStartingSalary: number;
  avg3YearSalary: number;
  avg5YearSalary: number;
  topEmployers: string[];
  formalContractRate: number;
  epfEsiCoverage: number;
  femaleEnrollmentPercent: number;
  safetyScore: number;
  nsqfProgression: TradeProgressionStep[];
  parentRebuttal: {
    statusMyth: { en: string; te: string; hi: string };
    statusFact: { en: string; te: string; hi: string };
    degreeComparison: { en: string; te: string; hi: string };
    socialStandingAdvise: { en: string; te: string; hi: string };
  };
  roleModel: {
    name: string;
    location: string;
    originBackground: string;
    currentRole: string;
    currentIncome: string;
    quoteTe: string;
    quoteHi: string;
    quoteEn: string;
  };
  suitableFor: {
    educationReq: string;
    interests: string[];
  };
}

export interface EscalationCase {
  id: string;
  timestamp: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  state: string;
  district: string;
  preferredLanguage: string;
  tradeInterest: string;
  primaryObjection: ParentalObjectionType;
  status: "Pending" | "In Progress" | "Resolved";
  assignedCenter: string;
  assignedOfficer: string;
  officerPhone: string;
  parentNotes: string;
  counsellorNotes: string;
  preSentimentScore: number;
  postSentimentScore?: number;
  dropoutRiskLevel: "Low" | "Medium" | "High";
}

export interface DistrictResistanceData {
  district: string;
  state: string;
  totalSessions: number;
  socialStatusResistance: number;
  earningResistance: number;
  degreeResistance: number;
  safetyResistance: number;
  primaryBlocker: string;
}

export interface ResistanceAnalyticsSummary {
  totalSessionsTracked: number;
  avgSentimentShiftDelta: number;
  escalationRatePercent: number;
  dropoutRiskAlertsCount: number;
  objectionDistribution: Record<string, number>;
  districtHeatmap: DistrictResistanceData[];
  resolvedCasesCount: number;
}
