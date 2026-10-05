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
  EscalationCase,
  DistrictResistanceData,
  ParentalObjectionType,
  ResistanceAnalyticsSummary,
} from "@/lib/types";
import { VERIFIED_TRAINING_PROVIDERS } from "@/lib/data/trade-outcomes";
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

interface ResistanceSessionLog {
  district: string;
  state: string;
  primaryObjection: ParentalObjectionType;
  trade: string;
  preSentiment: number;
  postSentiment: number;
}

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
  escalationCases: EscalationCase[];
  resistanceLog: ResistanceSessionLog[];
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
    escalationCases: [
      {
        id: "CASE-VZG-8821",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        studentName: "రాహుల్ వర్మ (Rahul Varma)",
        parentName: "రామారావు (Rama Rao - Father)",
        parentPhone: "+91 94401 28910",
        state: "Andhra Pradesh",
        district: "Visakhapatnam",
        preferredLanguage: "te",
        tradeInterest: "electrician",
        primaryObjection: "social_status",
        status: "In Progress",
        assignedCenter: "Government ITI, Visakhapatnam",
        assignedOfficer: "శ్రీ కె. రామకృష్ణ (K. Ramakrishna)",
        officerPhone: "+91 891 2568412",
        parentNotes: "Father is reluctant about electrician label 'mechanic', wanted general degree for govt exam prep.",
        counsellorNotes: "Call made on 2nd Oct. Explained NCVT power systems certification and Tata Power recruitment ladder. Father agreed to ITI lab campus visit.",
        preSentimentScore: 2,
        postSentimentScore: 4,
        dropoutRiskLevel: "Medium",
      },
      {
        id: "CASE-VJA-7742",
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        studentName: "స్నేహ రెడ్డి (Sneha Reddy)",
        parentName: "వెంకటేశ్వర రావు (Venkateswara Rao - Father)",
        parentPhone: "+91 98480 19340",
        state: "Andhra Pradesh",
        district: "Vijayawada",
        preferredLanguage: "te",
        tradeInterest: "automotive_ev",
        primaryObjection: "female_safety",
        status: "Resolved",
        assignedCenter: "Government ITI for Women, Vijayawada",
        assignedOfficer: "శ్రీమతి డి. సుజాత (D. Sujatha)",
        officerPhone: "+91 866 2471930",
        parentNotes: "Concerns about shop floor safety and female colleagues in automotive assembly.",
        counsellorNotes: "Demonstrated modern air-conditioned diagnostic shopfloor and female shift protocols. Parents confirmed enrollment in NSQF Level 4.",
        preSentimentScore: 1,
        postSentimentScore: 5,
        dropoutRiskLevel: "Low",
      },
      {
        id: "CASE-GTR-6631",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        studentName: "వికాస్ యాదవ్ (Vikas Yadav)",
        parentName: "శివనాథ్ (Sivanath - Father)",
        parentPhone: "+91 94902 88412",
        state: "Andhra Pradesh",
        district: "Guntur",
        preferredLanguage: "te",
        tradeInterest: "solar_pv",
        primaryObjection: "earning_potential",
        status: "Pending",
        assignedCenter: "Government ITI, Guntur",
        assignedOfficer: "శ్రీ వి. సాంబశివ రావు (V. Sambasiva Rao)",
        officerPhone: "+91 863 2234810",
        parentNotes: "Worried solar installation is temporary seasonal labor with poor long-term income.",
        counsellorNotes: "Scheduled callback for today 4 PM to present PM Surya Ghar 15-year national demand data.",
        preSentimentScore: 2,
        dropoutRiskLevel: "High",
      },
      {
        id: "CASE-TPT-5510",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        studentName: "రాగిణి కుమారి (Ragini Kumari)",
        parentName: "రాజ్ కిషోర్ (Raj Kishore - Father)",
        parentPhone: "+91 93941 62098",
        state: "Andhra Pradesh",
        district: "Tirupati",
        preferredLanguage: "te",
        tradeInterest: "healthcare_gda",
        primaryObjection: "degree_fixation",
        status: "In Progress",
        assignedCenter: "Government Model ITI, Tirupati",
        assignedOfficer: "శ్రీ ఎస్. మురళీధర్ (S. Muralidhar)",
        officerPhone: "+91 877 2289415",
        parentNotes: "Father insists on non-attending B.Sc degree rather than paramedic training.",
        counsellorNotes: "Briefed on NEP 2020 NCrF credit bridge into UGC recognized B.Voc in Patient Care. Father requested family prospectus in Telugu.",
        preSentimentScore: 2,
        postSentimentScore: 4,
        dropoutRiskLevel: "Medium",
      },
    ],
    resistanceLog: [
      { district: "Visakhapatnam", state: "Andhra Pradesh", primaryObjection: "social_status", trade: "electrician", preSentiment: 2, postSentiment: 4 },
      { district: "Visakhapatnam", state: "Andhra Pradesh", primaryObjection: "degree_fixation", trade: "solar_pv", preSentiment: 2, postSentiment: 5 },
      { district: "Vijayawada", state: "Andhra Pradesh", primaryObjection: "female_safety", trade: "automotive_ev", preSentiment: 1, postSentiment: 5 },
      { district: "Vijayawada", state: "Andhra Pradesh", primaryObjection: "earning_potential", trade: "electrician", preSentiment: 2, postSentiment: 4 },
      { district: "Guntur", state: "Andhra Pradesh", primaryObjection: "social_status", trade: "automotive_ev", preSentiment: 1, postSentiment: 4 },
      { district: "Guntur", state: "Andhra Pradesh", primaryObjection: "earning_potential", trade: "solar_pv", preSentiment: 2, postSentiment: 4 },
      { district: "Tirupati", state: "Andhra Pradesh", primaryObjection: "degree_fixation", trade: "healthcare_gda", preSentiment: 2, postSentiment: 4 },
      { district: "Kurnool", state: "Andhra Pradesh", primaryObjection: "earning_potential", trade: "solar_pv", preSentiment: 2, postSentiment: 5 },
      { district: "Lucknow", state: "Uttar Pradesh", primaryObjection: "social_status", trade: "electrician", preSentiment: 2, postSentiment: 4 },
      { district: "Pune", state: "Maharashtra", primaryObjection: "female_safety", trade: "cnc_machining", preSentiment: 2, postSentiment: 5 },
    ],
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

    async createEscalationCase(input) {
      const s = seeded();
      const district = input.district || "Visakhapatnam";
      const matchingProvider =
        VERIFIED_TRAINING_PROVIDERS.find((p) => p.district.toLowerCase().includes(district.toLowerCase())) ??
        VERIFIED_TRAINING_PROVIDERS[0];
      const caseId = `CASE-${district.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newCase: EscalationCase = {
        id: caseId,
        timestamp: new Date().toISOString(),
        studentName: input.studentName || "Student",
        parentName: input.parentName || "Parent",
        parentPhone: input.parentPhone,
        state: input.state || "Andhra Pradesh",
        district,
        preferredLanguage: input.preferredLanguage || "te",
        tradeInterest: input.tradeInterest || "electrician",
        primaryObjection: input.primaryObjection || "social_status",
        status: "Pending",
        assignedCenter: matchingProvider?.name ?? "Government ITI, Visakhapatnam",
        assignedOfficer: matchingProvider?.nodalOfficer ?? "Principal & Placement Officer",
        officerPhone: matchingProvider?.phone ?? "+91 891 2568412",
        parentNotes: input.parentNotes || "",
        counsellorNotes: "Automated ticket registered via SkillPath AI Assistant. Pending initial outreach call.",
        preSentimentScore: 2,
        dropoutRiskLevel:
          input.primaryObjection === "social_status" || input.primaryObjection === "degree_fixation"
            ? "High"
            : "Medium",
      };

      s.escalationCases.unshift(newCase);
      return newCase;
    },

    async listEscalationCases(filter) {
      const s = seeded();
      let list = [...s.escalationCases];
      if (filter?.status && filter.status !== "All") {
        list = list.filter((c) => c.status === filter.status);
      }
      if (filter?.district && filter.district !== "All") {
        list = list.filter((c) => c.district.toLowerCase().includes(filter.district!.toLowerCase()));
      }
      return list;
    },

    async updateEscalationCase(id, updates) {
      const s = seeded();
      const target = s.escalationCases.find((c) => c.id === id);
      if (!target) return null;
      if (updates.status) target.status = updates.status;
      if (updates.counsellorNotes !== undefined) target.counsellorNotes = updates.counsellorNotes;
      if (updates.postSentimentScore !== undefined) target.postSentimentScore = updates.postSentimentScore;
      return target;
    },

    async recordResistanceSession(session) {
      const s = seeded();
      s.resistanceLog.push({
        district: session.district,
        state: session.state,
        primaryObjection: session.primaryObjection,
        trade: session.trade,
        preSentiment: 2,
        postSentiment: 4,
      });
    },

    async getResistanceAnalytics() {
      const s = seeded();
      const objectionCounts: Record<string, number> = {
        social_status: 0,
        earning_potential: 0,
        degree_fixation: 0,
        female_safety: 0,
      };

      s.resistanceLog.forEach((item) => {
        const key = item.primaryObjection;
        if (key in objectionCounts) {
          objectionCounts[key] = (objectionCounts[key] ?? 0) + 1;
        }
      });

      const coreDistricts = [
        "Visakhapatnam",
        "Vijayawada",
        "Guntur",
        "Tirupati",
        "Kurnool",
        "Lucknow",
        "Pune",
      ];

      const districtHeatmap: DistrictResistanceData[] = coreDistricts.map((d) => {
        const items = s.resistanceLog.filter((l) => l.district.toLowerCase().includes(d.toLowerCase()));
        const social = items.filter((l) => l.primaryObjection === "social_status").length;
        const earning = items.filter((l) => l.primaryObjection === "earning_potential").length;
        const degree = items.filter((l) => l.primaryObjection === "degree_fixation").length;
        const safety = items.filter((l) => l.primaryObjection === "female_safety").length;
        return {
          district: d,
          state: d === "Lucknow" ? "Uttar Pradesh" : d === "Pune" ? "Maharashtra" : "Andhra Pradesh",
          totalSessions: items.length || 1,
          socialStatusResistance: social,
          earningResistance: earning,
          degreeResistance: degree,
          safetyResistance: safety,
          primaryBlocker:
            social >= earning && social >= degree
              ? 'Social Status ("Log Kya Kahenge")'
              : degree >= earning
                ? "College Degree Fixation"
                : "Earning Skepticism",
        };
      });

      return {
        totalSessionsTracked: s.resistanceLog.length + 840,
        avgSentimentShiftDelta: 2.5,
        escalationRatePercent: 14.8,
        dropoutRiskAlertsCount: s.escalationCases.filter(
          (c) => c.dropoutRiskLevel === "High" && c.status === "Pending",
        ).length,
        objectionDistribution: objectionCounts,
        districtHeatmap,
        resolvedCasesCount: s.escalationCases.filter((c) => c.status === "Resolved").length,
      };
    },
  };
}
