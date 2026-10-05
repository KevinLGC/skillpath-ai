import { getStore } from "@/lib/db";

export async function GET() {
  try {
    const store = getStore();
    const analytics = await store.getResistanceAnalytics();
    return Response.json(analytics);
  } catch (error) {
    console.error("[api:analytics:resistance] Error:", error);
    return Response.json({ error: "Failed to load resistance analytics" }, { status: 500 });
  }
}
