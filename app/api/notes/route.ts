import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getStore, useLocalStore } from "@/lib/db";

const schema = z.object({
  studentId: z.string().min(1),
  note: z.string().min(2).max(2000),
  recommendationId: z.string().nullable().default(null),
});

/** Counsellor notes are restricted to counsellor and admin roles. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "counsellor" && user.role !== "admin")) {
    return Response.json({ error: "Only a counsellor can add notes" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid note" }, { status: 400 });

  const store = user.kind === "demo" ? useLocalStore() : getStore();
  const note = await store.addNote({
    counsellorId: user.id,
    counsellorName: user.name,
    studentId: parsed.data.studentId,
    recommendationId: parsed.data.recommendationId,
    note: parsed.data.note,
  });

  return Response.json({ note });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  if (!studentId) return Response.json({ error: "studentId is required" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const store = user.kind === "demo" ? useLocalStore() : getStore();
  const notes = await store.listNotes(studentId);
  return Response.json({ notes });
}
