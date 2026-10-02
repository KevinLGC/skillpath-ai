import { z } from "zod";
import { getActiveStudentId, getSessionUser } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { newId } from "@/lib/utils/id";

const createSchema = z.object({
  careerSlugs: z.array(z.string().min(1)).max(5).default([]),
  scope: z.enum(["family_view", "report", "full"]).default("family_view"),
  days: z.number().int().min(1).max(90).default(30),
});

/**
 * Family sharing.
 *
 * A share link is: tokenised, scoped, expiring, revocable — and its creation
 * writes a consent record. That is what makes "consent for family sharing" a
 * real feature rather than a sentence in a document.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return Response.json({ error: "Invalid share request" }, { status: 400 });
  }

  const user = await getSessionUser();
  const studentId = await getActiveStudentId(user);
  if (!studentId) {
    return Response.json({ error: "Sign in as the student to share this plan" }, { status: 401 });
  }

  const store = getStore();
  const expiresAt = new Date(Date.now() + parsed.data.days * 24 * 60 * 60 * 1000).toISOString();
  const consentId = newId("consent");

  const link = await store.createShareLink({
    studentId,
    careerSlugs: parsed.data.careerSlugs,
    scope: parsed.data.scope,
    expiresAt,
    consentId,
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return Response.json({
    link: {
      id: link.id,
      token: link.token,
      url: `${base}/share/${link.token}`,
      expiresAt: link.expiresAt,
      scope: link.scope,
      consentId,
    },
  });
}

export async function DELETE(request: Request) {
  const json = (await request.json().catch(() => ({}))) as { id?: string };
  if (!json.id) return Response.json({ error: "id is required" }, { status: 400 });

  const user = await getSessionUser();
  const studentId = await getActiveStudentId(user);
  if (!studentId) return Response.json({ error: "Not signed in" }, { status: 401 });

  const ok = await getStore().revokeShareLink(json.id, studentId);
  return Response.json({ revoked: ok }, { status: ok ? 200 : 404 });
}

export async function GET() {
  const user = await getSessionUser();
  const studentId = await getActiveStudentId(user);
  if (!studentId) return Response.json({ links: [] });
  const links = await getStore().listShareLinks(studentId);
  return Response.json({
    links: links.map((link) => ({
      id: link.id,
      token: link.token,
      expiresAt: link.expiresAt,
      revokedAt: link.revokedAt,
      scope: link.scope,
      careerSlugs: link.careerSlugs,
    })),
  });
}
