import { buildDemoProfile, DEMO_ASSESSMENT_ID, DEMO_CONSTRAINTS, DEMO_STUDENT_ID, DEMO_STUDENT_NAME } from "@/lib/demo/student";
import type {
  ChatMessageRecord,
  ChatSessionRecord,
  CounsellorNote,
  DecisionReport,
  Recommendation,
  Roadmap,
  ShareLink,
  StudentOverview,
} from "@/lib/types";
import {
  isShareLinkActive,
  type AssessmentRecord,
  type NewChatSession,
  type NewCounsellorNote,
  type NewReport,
  type NewShareLink,
  type Store,
} from "@/lib/db/types";
import { newId, shareToken } from "@/lib/utils/id";

interface MemoryState {
  assessments: Map<string, AssessmentRecord>;
  recommendations: Map<string, Recommendation[]>;
  roadmaps: Map<string, Roadmap>;
  shareLinks: Map<string, ShareLink>;
  notes: CounsellorNote[];
  sessions: Map<string, ChatSessionRecord & { profileSnapshot: unknown }>;
  messages: Map<string, ChatMessageRecord[]>;
  reports: Map<string, DecisionReport>;
  usage: Map<string, number>;
}

/**
 * In-memory driver. Keeps the prototype fully functional with no external
 * services: the demo student's assessment is pre-seeded on first access so the
 * dashboard, results and family views all have real data to work with.
 *
 * State is attached to globalThis so it survives Next.js hot reloads in dev.
 */
const globalKey = "__skillpath_memory_store__";

function createState(): MemoryState {
  return {
    assessments: new Map(),
    recommendations: new Map(),
    roadmaps: new Map(),
    shareLinks: new Map(),
    notes: [],
    sessions: new Map(),
    messages: new Map(),
    reports: new Map(),
    usage: new Map(),
  };
}

function state(): MemoryState {
  const holder = globalThis as unknown as Record<string, MemoryState | undefined>;
  holder[globalKey] ??= createState();
  return holder[globalKey]!;
}

function seeded(): MemoryState {
  const s = state();
  if (!s.assessments.has(DEMO_ASSESSMENT_ID)) {
    const profile = buildDemoProfile();
    s.assessments.set(DEMO_ASSESSMENT_ID, {
      id: DEMO_ASSESSMENT_ID,
      studentId: DEMO_STUDENT_ID,
      educationLevel: "class12",
      answers: [],
      constraints: DEMO_CONSTRAINTS,
      profile,
      createdAt: "2026-10-02T09:00:00.000Z",
    });
  }
  return s;
}

export function createMemoryStore(): Store {
  return {
    kind: "memory",

    async saveAssessment(record) {
      seeded().assessments.set(record.id, record);
    },

    async getAssessment(id) {
      return seeded().assessments.get(id) ?? null;
    },

    async listAssessments(studentId) {
      return [...seeded().assessments.values()]
        .filter((a) => a.studentId === studentId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async saveRecommendations(assessmentId, _studentId, items) {
      seeded().recommendations.set(assessmentId, items);
    },

    async getRecommendations(assessmentId) {
      return seeded().recommendations.get(assessmentId) ?? [];
    },

    async getRecommendationsForStudent(studentId) {
      const s = seeded();
      const own = [...s.recommendations.entries()]
        .filter(([, items]) => items.some((item) => item.studentId === studentId))
        .sort(([a], [b]) => a.localeCompare(b));
      const latest = own[own.length - 1];
      if (latest) return latest[1];
      // Demo fallback: the seeded assessment always has explanation data available.
      const assessment = [...s.assessments.values()].find((a) => a.studentId === studentId);
      return assessment ? (s.recommendations.get(assessment.id) ?? []) : [];
    },

    async saveRoadmap(roadmap) {
      seeded().roadmaps.set(`${roadmap.studentId}:${roadmap.careerSlug}`, roadmap);
    },

    async getRoadmap(studentId, careerSlug) {
      return seeded().roadmaps.get(`${studentId}:${careerSlug}`) ?? null;
    },

    async createShareLink(input: NewShareLink) {
      const link: ShareLink = {
        id: newId("share"),
        token: shareToken(),
        studentId: input.studentId,
        careerSlugs: input.careerSlugs,
        scope: input.scope,
        createdAt: new Date().toISOString(),
        expiresAt: input.expiresAt,
        revokedAt: null,
      };
      seeded().shareLinks.set(link.token, link);
      return link;
    },

    async getShareLink(token) {
      const link = seeded().shareLinks.get(token) ?? null;
      if (!link) return null;
      return isShareLinkActive(link) ? link : null;
    },

    async listShareLinks(studentId) {
      return [...seeded().shareLinks.values()]
        .filter((link) => link.studentId === studentId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async revokeShareLink(id, studentId) {
      const link = [...seeded().shareLinks.values()].find((l) => l.id === id && l.studentId === studentId);
      if (!link) return false;
      link.revokedAt = new Date().toISOString();
      return true;
    },

    async addNote(input: NewCounsellorNote) {
      const note: CounsellorNote = {
        id: newId("note"),
        counsellorId: input.counsellorId,
        studentId: input.studentId,
        recommendationId: input.recommendationId,
        note: input.note,
        createdAt: new Date().toISOString(),
      };
      seeded().notes.push(note);
      return note;
    },

    async listNotes(studentId) {
      return seeded().notes.filter((note) => note.studentId === studentId);
    },

    async createChatSession(input: NewChatSession) {
      const session: ChatSessionRecord = {
        id: newId("chat"),
        userId: input.userId,
        studentId: input.studentId,
        roleContext: input.roleContext,
        locale: input.locale,
        createdAt: new Date().toISOString(),
      };
      seeded().sessions.set(session.id, { ...session, profileSnapshot: input.profileSnapshot });
      return session;
    },

    async getChatSession(id) {
      const session = seeded().sessions.get(id);
      if (!session) return null;
      const { profileSnapshot: _ignored, ...record } = session;
      return record;
    },

    async appendMessage(message) {
      const list = seeded().messages.get(message.sessionId) ?? [];
      list.push(message);
      seeded().messages.set(message.sessionId, list);
    },

    async listMessages(sessionId) {
      return seeded().messages.get(sessionId) ?? [];
    },

    async saveReport(input: NewReport) {
      seeded().reports.set(input.id, input.report);
      if (input.shareToken) {
        seeded().shareLinks.set(input.shareToken, {
          id: newId("share"),
          token: input.shareToken,
          studentId: input.studentId,
          careerSlugs: [input.careerSlug],
          scope: "report",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          revokedAt: null,
        });
      }
    },

    async getReport(id) {
      return seeded().reports.get(id) ?? null;
    },

    async getReportByToken(token) {
      const link = seeded().shareLinks.get(token);
      if (!link) return null;
      if (!isShareLinkActive(link)) return null;
      const report = [...seeded().reports.values()].find((item) => item.id.includes(link.id.split("_")[1] ?? ""));
      if (report) return { report, studentId: link.studentId };
      const anyReport = [...seeded().reports.values()].find((item) => item.studentId === link.studentId);
      return anyReport ? { report: anyReport, studentId: link.studentId } : null;
    },

    async getUsage(userId, day) {
      return seeded().usage.get(`${userId}:${day}`) ?? 0;
    },

    async incrementUsage(userId, day) {
      const key = `${userId}:${day}`;
      const next = (seeded().usage.get(key) ?? 0) + 1;
      seeded().usage.set(key, next);
      return next;
    },

    async listStudents() {
      const s = seeded();
      const demoAssessment = s.assessments.get(DEMO_ASSESSMENT_ID);
      const rows: StudentOverview[] = [
        {
          studentId: DEMO_STUDENT_ID,
          name: DEMO_STUDENT_NAME,
          educationLevel: demoAssessment?.educationLevel ?? "class12",
          district: DEMO_CONSTRAINTS.district,
          status: "completed",
          assessmentDate: demoAssessment?.createdAt ?? null,
          topCareer: (s.recommendations.get(DEMO_ASSESSMENT_ID) ?? [])[0]?.careerSlug ?? "ev-technician",
        },
        {
          studentId: "demo-student-anjali",
          name: "Anjali",
          educationLevel: "class10",
          district: "Guntur",
          status: "assessment_pending",
          assessmentDate: null,
          topCareer: null,
        },
        {
          studentId: "demo-student-arjun",
          name: "Arjun",
          educationLevel: "class12",
          district: "Nellore",
          status: "needs_review",
          assessmentDate: "2026-09-28T10:30:00.000Z",
          topCareer: "cnc-machine-operator",
        },
      ];
      return rows;
    },
  };
}
