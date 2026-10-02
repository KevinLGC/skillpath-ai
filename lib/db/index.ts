import { createMemoryStore } from "@/lib/db/memory";
import { createSupabaseStore } from "@/lib/db/supabase";
import type { Store } from "@/lib/db/types";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

/**
 * Driver selection. Supabase is used when it is fully configured (URL +
 * publishable key + server secret). Otherwise the app runs on the local demo
 * driver, which is what makes the prototype demo-proof: no network dependency
 * between the student and their own results.
 */
let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  cached = isSupabaseAdminConfigured() ? createSupabaseStore() : createMemoryStore();
  return cached;
}

/** Test seam: lets a caller (or a test) force the local driver. */
export function useLocalStore() {
  cached = createMemoryStore();
  return cached;
}

export { isShareLinkActive } from "@/lib/db/types";
export type { Store, AssessmentRecord, NewShareLink, NewReport, NewCounsellorNote, NewChatSession } from "@/lib/db/types";
