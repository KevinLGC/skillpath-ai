import { AI_DAILY_QUOTA } from "@/lib/ai/config";
import { getStore } from "@/lib/db";
import { todayKey } from "@/lib/utils/id";

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Per-user daily quota. Protects the free-tier API budget and, deliberately,
 * limits how much a single account can hammer the endpoint during a public demo.
 */
export async function checkQuota(userId: string): Promise<QuotaStatus> {
  const store = getStore();
  const day = todayKey();
  const used = await store.getUsage(userId, day);
  return { allowed: used < AI_DAILY_QUOTA, used, limit: AI_DAILY_QUOTA };
}

export async function consumeQuota(userId: string): Promise<QuotaStatus> {
  const store = getStore();
  const day = todayKey();
  const used = await store.incrementUsage(userId, day);
  return { allowed: used <= AI_DAILY_QUOTA, used, limit: AI_DAILY_QUOTA };
}
