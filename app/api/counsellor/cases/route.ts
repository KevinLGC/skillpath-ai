import { z } from "zod";
import { getStore } from "@/lib/db";

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["Pending", "In Progress", "Resolved"]).optional(),
  counsellorNotes: z.string().optional(),
  postSentimentScore: z.number().min(1).max(5).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const district = url.searchParams.get("district") || undefined;

  const store = getStore();
  const cases = await store.listEscalationCases({ status, district });
  return Response.json({ cases, total: cases.length });
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid patch payload" }, { status: 400 });
    }

    const store = getStore();
    const updated = await store.updateEscalationCase(parsed.data.id, {
      status: parsed.data.status,
      counsellorNotes: parsed.data.counsellorNotes,
      postSentimentScore: parsed.data.postSentimentScore,
    });

    if (!updated) {
      return Response.json({ error: "Case not found" }, { status: 404 });
    }

    return Response.json({ success: true, updatedCase: updated });
  } catch (error) {
    console.error("[api:counsellor:cases] PATCH error:", error);
    return Response.json({ error: "Failed to update case" }, { status: 500 });
  }
}
