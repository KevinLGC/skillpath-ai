import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { newId, shareToken } from "@/lib/utils/id";
import { isShareLinkActive, type NewReport, type NewShareLink, type Store } from "@/lib/db/types";
import { DEMO_ASSESSMENT_ID, DEMO_STUDENT_ID } from "@/lib/demo/student";
import { createMemoryStore } from "@/lib/db/memory";
import type {
  ChatMessageRecord,
  ChatSessionRecord,
  CounsellorNote,
  DecisionReport,
  EducationLevel,
  Recommendation,
  Roadmap,
  ShareLink,
  StudentOverview,
} from "@/lib/types";

/**
 * Supabase driver. One row per entity, with the rich engine payload kept in a
 * jsonb column so a stored recommendation is byte-for-byte reproducible
 * (including the factor trace that produced it).
 *
 * Every method degrades gracefully: a failing query logs and returns an empty
 * result rather than taking down a page mid-demo.
 */
function client(): SupabaseClient | null {
  return getSupabaseAdminClient();
}

function logError(scope: string, error: unknown) {
  console.error(`[supabase:${scope}]`, error instanceof Error ? error.message : error);
}

export function createSupabaseStore(): Store {
  return {
    kind: "supabase",

    async saveAssessment(record) {
      const db = client();
      if (!db) return;
      const { error } = await db.from("assessments").upsert({
        id: record.id,
        student_id: record.studentId,
        education_level: record.educationLevel,
        answers: record.answers,
        constraints: record.constraints,
        profile: record.profile,
        created_at: record.createdAt,
      });
      if (error) logError("saveAssessment", error);
    },

    async getAssessment(id) {
      if (id === DEMO_ASSESSMENT_ID) {
        return createMemoryStore().getAssessment(id);
      }
      const db = client();
      if (!db) return null;
      const { data, error } = await db.from("assessments").select("*").eq("id", id).maybeSingle();
      if (error) {
        logError("getAssessment", error);
        return id === DEMO_ASSESSMENT_ID ? createMemoryStore().getAssessment(id) : null;
      }
      if (!data) return null;
      return {
        id: data.id as string,
        studentId: data.student_id as string,
        educationLevel: data.education_level as EducationLevel,
        answers: (data.answers ?? []) as never,
        constraints: data.constraints as never,
        profile: data.profile as never,
        createdAt: data.created_at as string,
      };
    },

    async listAssessments(studentId) {
      if (studentId === DEMO_STUDENT_ID) {
        return createMemoryStore().listAssessments(studentId);
      }
      const db = client();
      if (!db) return [];
      const { data, error } = await db
        .from("assessments")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });
      if (error) {
        logError("listAssessments", error);
        return studentId === DEMO_STUDENT_ID ? createMemoryStore().listAssessments(studentId) : [];
      }
      return (data ?? []).map((row) => ({
        id: row.id as string,
        studentId: row.student_id as string,
        educationLevel: row.education_level as EducationLevel,
        answers: (row.answers ?? []) as never,
        constraints: row.constraints as never,
        profile: row.profile as never,
        createdAt: row.created_at as string,
      }));
    },

    async saveRecommendations(assessmentId, studentId, items) {
      const db = client();
      if (!db) return;
      const rows = items.map((item) => ({
        id: item.id,
        assessment_id: assessmentId,
        student_id: studentId,
        career_slug: item.careerSlug,
        score: item.score,
        raw_score: item.rawScore,
        confidence: item.confidence,
        eligible: item.eligible,
        engine_version: item.engineVersion,
        weights_version: item.weightsVersion,
        created_at: item.createdAt,
        payload: item,
      }));
      const { error } = await db.from("recommendations").upsert(rows);
      if (error) logError("saveRecommendations", error);
    },

    async getRecommendations(assessmentId) {
      const db = client();
      if (!db) return [];
      const { data, error } = await db
        .from("recommendations")
        .select("payload")
        .eq("assessment_id", assessmentId)
        .order("score", { ascending: false });
      if (error) {
        logError("getRecommendations", error);
        return [];
      }
      return (data ?? []).map((row) => row.payload as Recommendation);
    },

    async getRecommendationsForStudent(studentId) {
      if (studentId === DEMO_STUDENT_ID) {
        return createMemoryStore().getRecommendationsForStudent(studentId);
      }
      const db = client();
      if (!db) return [];
      const { data, error } = await db
        .from("recommendations")
        .select("payload, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        logError("getRecommendationsForStudent", error);
        return studentId === DEMO_STUDENT_ID ? createMemoryStore().getRecommendationsForStudent(studentId) : [];
      }
      return (data ?? []).map((row) => row.payload as Recommendation);
    },

    async saveRoadmap(roadmap) {
      const db = client();
      if (!db) return;
      const { error } = await db.from("roadmaps").upsert({
        id: roadmap.id,
        student_id: roadmap.studentId,
        career_slug: roadmap.careerSlug,
        steps: roadmap.steps,
        you_are_here_index: roadmap.youAreHereIndex,
        created_at: roadmap.createdAt,
      });
      if (error) logError("saveRoadmap", error);
    },

    async getRoadmap(studentId, careerSlug) {
      if (studentId === DEMO_STUDENT_ID) {
        return createMemoryStore().getRoadmap(studentId, careerSlug);
      }
      const db = client();
      if (!db) return createMemoryStore().getRoadmap(studentId, careerSlug);
      const { data, error } = await db
        .from("roadmaps")
        .select("*")
        .eq("student_id", studentId)
        .eq("career_slug", careerSlug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) {
        if (error) logError("getRoadmap", error);
        return createMemoryStore().getRoadmap(studentId, careerSlug);
      }
      return {
        id: data.id as string,
        studentId: data.student_id as string,
        careerSlug: data.career_slug as string,
        steps: data.steps as Roadmap["steps"],
        youAreHereIndex: (data.you_are_here_index as number) ?? 0,
        createdAt: data.created_at as string,
      };
    },

    async createShareLink(input: NewShareLink) {
      const db = client();
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
      if (db) {
        const { error } = await db.from("share_links").insert({
          id: link.id,
          token: link.token,
          student_id: link.studentId,
          career_slugs: link.careerSlugs,
          scope: link.scope,
          consent_id: input.consentId,
          expires_at: link.expiresAt,
          created_at: link.createdAt,
        });
        if (error) logError("createShareLink", error);
      }
      return link;
    },

    async getShareLink(token) {
      const db = client();
      if (!db) return createMemoryStore().getShareLink(token);
      const { data, error } = await db.from("share_links").select("*").eq("token", token).maybeSingle();
      if (error || !data) {
        if (error) logError("getShareLink", error);
        return createMemoryStore().getShareLink(token);
      }
      const link: ShareLink = {
        id: data.id as string,
        token: data.token as string,
        studentId: data.student_id as string,
        careerSlugs: (data.career_slugs ?? []) as string[],
        scope: data.scope as ShareLink["scope"],
        createdAt: data.created_at as string,
        expiresAt: data.expires_at as string,
        revokedAt: (data.revoked_at as string | null) ?? null,
      };
      return isShareLinkActive(link) ? link : null;
    },

    async listShareLinks(studentId) {
      if (studentId === DEMO_STUDENT_ID) {
        return createMemoryStore().listShareLinks(studentId);
      }
      const db = client();
      if (!db) return createMemoryStore().listShareLinks(studentId);
      const { data, error } = await db
        .from("share_links")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) {
        logError("listShareLinks", error);
        return [];
      }
      return (data ?? []).map((row) => ({
        id: row.id as string,
        token: row.token as string,
        studentId: row.student_id as string,
        careerSlugs: (row.career_slugs ?? []) as string[],
        scope: row.scope as ShareLink["scope"],
        createdAt: row.created_at as string,
        expiresAt: row.expires_at as string,
        revokedAt: (row.revoked_at as string | null) ?? null,
      }));
    },

    async revokeShareLink(id, studentId) {
      const db = client();
      if (!db) return false;
      const { error } = await db
        .from("share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id)
        .eq("student_id", studentId);
      if (error) {
        logError("revokeShareLink", error);
        return false;
      }
      return true;
    },

    async addNote(input) {
      const db = client();
      const note: CounsellorNote = {
        id: newId("note"),
        counsellorId: input.counsellorId,
        studentId: input.studentId,
        recommendationId: input.recommendationId,
        note: input.note,
        createdAt: new Date().toISOString(),
      };
      if (db) {
        const { error } = await db.from("counsellor_notes").insert({
          id: note.id,
          counsellor_id: note.counsellorId,
          student_id: note.studentId,
          recommendation_id: note.recommendationId,
          note: note.note,
          created_at: note.createdAt,
        });
        if (error) logError("addNote", error);
      }
      return note;
    },

    async listNotes(studentId) {
      if (studentId === DEMO_STUDENT_ID) {
        return createMemoryStore().listNotes(studentId);
      }
      const db = client();
      if (!db) return createMemoryStore().listNotes(studentId);
      const { data, error } = await db
        .from("counsellor_notes")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });
      if (error) {
        logError("listNotes", error);
        return createMemoryStore().listNotes(studentId);
      }
      return (data ?? []).map((row) => ({
        id: row.id as string,
        counsellorId: row.counsellor_id as string,
        studentId: row.student_id as string,
        recommendationId: (row.recommendation_id as string | null) ?? null,
        note: row.note as string,
        createdAt: row.created_at as string,
      }));
    },

    async createChatSession(input) {
      const db = client();
      const session: ChatSessionRecord = {
        id: newId("chat"),
        userId: input.userId,
        studentId: input.studentId,
        roleContext: input.roleContext,
        locale: input.locale,
        createdAt: new Date().toISOString(),
      };
      if (db) {
        const { error } = await db.from("chat_sessions").insert({
          id: session.id,
          user_id: session.userId,
          student_id: session.studentId,
          role_context: session.roleContext,
          locale: session.locale,
          profile_snapshot: input.profileSnapshot,
          created_at: session.createdAt,
        });
        if (error) logError("createChatSession", error);
      }
      return session;
    },

    async getChatSession(id) {
      const db = client();
      if (!db) return createMemoryStore().getChatSession(id);
      const { data, error } = await db.from("chat_sessions").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        if (error) logError("getChatSession", error);
        return createMemoryStore().getChatSession(id);
      }
      return {
        id: data.id as string,
        userId: data.user_id as string,
        studentId: (data.student_id as string | null) ?? null,
        roleContext: data.role_context as ChatSessionRecord["roleContext"],
        locale: data.locale as ChatSessionRecord["locale"],
        createdAt: data.created_at as string,
      };
    },

    async appendMessage(message) {
      const db = client();
      if (!db) return;
      const { error } = await db.from("chat_messages").insert({
        id: message.id,
        session_id: message.sessionId,
        role: message.role,
        content: message.content,
        grounding: message.grounding,
        sources: message.sources,
        mode: message.mode,
        created_at: message.createdAt,
      });
      if (error) logError("appendMessage", error);
    },

    async listMessages(sessionId) {
      const db = client();
      if (!db) return createMemoryStore().listMessages(sessionId);
      const { data, error } = await db
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) {
        logError("listMessages", error);
        return createMemoryStore().listMessages(sessionId);
      }
      return (data ?? []).map((row) => ({
        id: row.id as string,
        sessionId: row.session_id as string,
        role: row.role as ChatMessageRecord["role"],
        content: row.content as string,
        grounding: (row.grounding as ChatMessageRecord["grounding"]) ?? null,
        sources: (row.sources ?? []) as ChatMessageRecord["sources"],
        mode: (row.mode as ChatMessageRecord["mode"]) ?? null,
        createdAt: row.created_at as string,
      }));
    },

    async saveReport(input: NewReport) {
      const db = client();
      if (!db) return;
      const { error } = await db.from("reports").insert({
        id: input.id,
        student_id: input.studentId,
        career_slug: input.careerSlug,
        kind: "family_decision",
        snapshot: input.report.snapshot,
        share_token: input.shareToken,
        created_at: input.report.createdAt,
      });
      if (error) logError("saveReport", error);
    },

    async getReport(id) {
      const db = client();
      if (!db) return createMemoryStore().getReport(id);
      const { data, error } = await db.from("reports").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        if (error) logError("getReport", error);
        return createMemoryStore().getReport(id);
      }
      return {
        id: data.id as string,
        studentId: data.student_id as string,
        careerSlug: data.career_slug as string,
        locale: (data.locale as DecisionReport["locale"]) ?? "en",
        createdAt: data.created_at as string,
        snapshot: data.snapshot as DecisionReport["snapshot"],
      };
    },

    async getReportByToken(token) {
      const link = await this.getShareLink(token);
      if (!link) return createMemoryStore().getReportByToken(token);
      const db = client();
      if (!db) return createMemoryStore().getReportByToken(token);
      const { data, error } = await db
        .from("reports")
        .select("*")
        .eq("share_token", token)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) {
        if (error) logError("getReportByToken", error);
        return createMemoryStore().getReportByToken(token);
      }
      return {
        studentId: data.student_id as string,
        report: {
          id: data.id as string,
          studentId: data.student_id as string,
          careerSlug: data.career_slug as string,
          locale: (data.locale as DecisionReport["locale"]) ?? "en",
          createdAt: data.created_at as string,
          snapshot: data.snapshot as DecisionReport["snapshot"],
        },
      };
    },

    async getUsage(userId, day) {
      if (userId.startsWith("demo-")) {
        return createMemoryStore().getUsage(userId, day);
      }
      const db = client();
      if (!db) return createMemoryStore().getUsage(userId, day);
      const { data, error } = await db
        .from("ai_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("day", day)
        .maybeSingle();
      if (error) {
        logError("getUsage", error);
        return createMemoryStore().getUsage(userId, day);
      }
      return (data?.count as number | undefined) ?? 0;
    },

    async incrementUsage(userId, day) {
      if (userId.startsWith("demo-")) {
        return createMemoryStore().incrementUsage(userId, day);
      }
      const db = client();
      if (!db) return createMemoryStore().incrementUsage(userId, day);
      const current = await this.getUsage(userId, day);
      const next = current + 1;
      const { error } = await db
        .from("ai_usage")
        .upsert({ user_id: userId, day, count: next }, { onConflict: "user_id,day" });
      if (error) {
        logError("incrementUsage", error);
        return createMemoryStore().incrementUsage(userId, day);
      }
      return next;
    },

    async listStudents() {
      const db = client();
      if (!db) return createMemoryStore().listStudents();
      const { data, error } = await db
        .from("profiles")
        .select("id, full_name, education_level, district, created_at")
        .eq("role", "student")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error || !data || data.length === 0) {
        return createMemoryStore().listStudents();
      }
      return (data ?? []).map((row) => ({
        studentId: row.id as string,
        name: (row.full_name as string) ?? "Student",
        educationLevel: (row.education_level as EducationLevel) ?? "class10",
        district: (row.district as string) ?? "",
        status: "completed" as const,
        assessmentDate: null,
        topCareer: null,
      }));
    },
  };
}
