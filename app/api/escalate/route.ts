import { z } from "zod";
import { getStore } from "@/lib/db";

const escalateSchema = z.object({
  studentName: z.string().optional().default("Student"),
  parentName: z.string().optional().default("Parent"),
  parentPhone: z.string().min(8, "Phone number is required"),
  state: z.string().optional().default("Andhra Pradesh"),
  district: z.string().optional().default("Visakhapatnam"),
  preferredLanguage: z.string().optional().default("te"),
  tradeInterest: z.string().optional().default("electrician"),
  primaryObjection: z
    .enum(["social_status", "earning_potential", "degree_fixation", "female_safety", "general"])
    .optional()
    .default("social_status"),
  parentNotes: z.string().optional().default(""),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = escalateSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid escalation payload", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const store = getStore();
    const newCase = await store.createEscalationCase(parsed.data);

    return Response.json({
      success: true,
      case: newCase,
      message: "Escalation ticket registered with district nodal ITI placement officer.",
    });
  } catch (error) {
    console.error("[api:escalate] Error:", error);
    return Response.json({ error: "Failed to create escalation ticket" }, { status: 500 });
  }
}
