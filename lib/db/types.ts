import type {
  ChatMessageRecord,
  ChatSessionRecord,
  CounsellorNote,
  DecisionReport,
  EducationLevel,
  Recommendation,
  Roadmap,
  ShareLink,
  StudentConstraints,
  StudentOverview,
  StudentProfile,
  EscalationCase,
  ParentalObjectionType,
  ResistanceAnalyticsSummary,
} from "@/lib/types";
import type { RawAnswer } from "@/lib/assessment/score";

export interface AssessmentRecord {
  id: string;
  studentId: string;
  educationLevel: EducationLevel;
  answers: RawAnswer[];
  constraints: StudentConstraints;
  profile: StudentProfile;
  createdAt: string;
}

export interface NewShareLink {
  studentId: string;
  careerSlugs: string[];
  scope: ShareLink["scope"];
  expiresAt: string;
  /** Consent record id captured when the student shares the plan. */
  consentId: string | null;
}

export interface NewCounsellorNote {
  counsellorId: string;
  counsellorName: string;
  studentId: string;
  recommendationId: string | null;
  note: string;
}

export interface NewChatSession {
  userId: string;
  studentId: string | null;
  roleContext: ChatSessionRecord["roleContext"];
  locale: ChatSessionRecord["locale"];
  profileSnapshot: StudentProfile | null;
}

export interface NewReport {
  id: string;
  studentId: string;
  careerSlug: string;
  shareToken: string | null;
  report: DecisionReport;
}

/**
 * Storage contract. Two drivers implement it:
 *   - memory  : seeded demo data + in-process writes (works with zero setup)
 *   - supabase: Postgres + RLS (activated automatically when env keys exist)
 *
 * The app never talks to a database directly; it talks to this interface.
 */
export interface Store {
  kind: "memory" | "supabase";

  saveAssessment(record: AssessmentRecord): Promise<void>;
  getAssessment(id: string): Promise<AssessmentRecord | null>;
  listAssessments(studentId: string): Promise<AssessmentRecord[]>;

  saveRecommendations(assessmentId: string, studentId: string, items: Recommendation[]): Promise<void>;
  getRecommendations(assessmentId: string): Promise<Recommendation[]>;
  getRecommendationsForStudent(studentId: string): Promise<Recommendation[]>;

  saveRoadmap(roadmap: Roadmap): Promise<void>;
  getRoadmap(studentId: string, careerSlug: string): Promise<Roadmap | null>;

  createShareLink(link: NewShareLink): Promise<ShareLink>;
  getShareLink(token: string): Promise<ShareLink | null>;
  listShareLinks(studentId: string): Promise<ShareLink[]>;
  revokeShareLink(id: string, studentId: string): Promise<boolean>;

  addNote(note: NewCounsellorNote): Promise<CounsellorNote>;
  listNotes(studentId: string): Promise<CounsellorNote[]>;

  createChatSession(session: NewChatSession): Promise<ChatSessionRecord>;
  getChatSession(id: string): Promise<ChatSessionRecord | null>;
  appendMessage(message: ChatMessageRecord): Promise<void>;
  listMessages(sessionId: string): Promise<ChatMessageRecord[]>;

  saveReport(report: NewReport): Promise<void>;
  getReport(id: string): Promise<DecisionReport | null>;
  getReportByToken(token: string): Promise<{ report: DecisionReport; studentId: string } | null>;

  getUsage(userId: string, day: string): Promise<number>;
  incrementUsage(userId: string, day: string): Promise<number>;

  listStudents(): Promise<StudentOverview[]>;

  createEscalationCase(input: {
    studentName: string;
    parentName: string;
    parentPhone: string;
    state?: string;
    district?: string;
    preferredLanguage?: string;
    tradeInterest?: string;
    primaryObjection?: ParentalObjectionType;
    parentNotes?: string;
  }): Promise<EscalationCase>;
  listEscalationCases(filter?: { status?: string; district?: string }): Promise<EscalationCase[]>;
  updateEscalationCase(
    id: string,
    updates: { status?: EscalationCase["status"]; counsellorNotes?: string; postSentimentScore?: number },
  ): Promise<EscalationCase | null>;
  getResistanceAnalytics(): Promise<ResistanceAnalyticsSummary>;
  recordResistanceSession(session: {
    district: string;
    state: string;
    primaryObjection: ParentalObjectionType;
    trade: string;
  }): Promise<void>;
}

/** Share links are valid only before expiry and only if not revoked. */
export function isShareLinkActive(link: ShareLink, now: Date = new Date()): boolean {
  if (link.revokedAt) return false;
  return new Date(link.expiresAt).getTime() > now.getTime();
}
