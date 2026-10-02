import { randomUUID, randomBytes } from "node:crypto";

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

/**
 * Share tokens are unguessable and URL-safe. 24 random bytes is far beyond
 * brute-force range for a link that is also expiring and revocable.
 */
export function shareToken(): string {
  return randomBytes(24).toString("base64url");
}

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
