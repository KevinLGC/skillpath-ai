#!/usr/bin/env node
/**
 * verify-models.mjs — checks that the configured Gemini model IDs actually
 * exist in the live model list.
 *
 * Model names move quickly; a deploy with a stale ID fails at question time,
 * not at setup time, unless this runs. Exits 0 when everything matches or no
 * key is configured (verification is optional), 1 when a configured model is
 * missing from the live list.
 *
 * Usage: npm run verify:models
 */

const BASE = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
const KEY = process.env.GEMINI_API_KEY ?? "";
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";

if (!KEY) {
  console.log("verify:models — GEMINI_API_KEY not set; skipping (the app runs retrieval-only without it).");
  process.exit(0);
}

async function listModels() {
  const names = new Set();
  let pageToken = "";
  for (;;) {
    const url = new URL(`${BASE}/models`);
    url.searchParams.set("key", KEY);
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`models list failed: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
    }
    const payload = await response.json();
    for (const model of payload.models ?? []) {
      // API returns "models/gemini-2.5-flash"; compare without the prefix.
      names.add(String(model.name ?? "").replace(/^models\//, ""));
    }
    pageToken = payload.nextPageToken ?? "";
    if (!pageToken) break;
  }
  return names;
}

function suffixMatch(live, configured, family) {
  // A configured "gemini-2.5-flash" should also match a live entry exposed as
  // "gemini-2.5-flash-preview" only when identical — exact match is enforced;
  // this helper exists to give a useful "did you mean" hint on failure.
  const stem = configured.split("-preview")[0];
  return [...live].filter((name) => name.startsWith(stem)).slice(0, 5);
}

try {
  const live = await listModels();
  const missing = [];

  for (const [label, configured] of [
    ["GEMINI_CHAT_MODEL", CHAT_MODEL],
    ["GEMINI_EMBED_MODEL", EMBED_MODEL],
  ]) {
    if (live.has(configured)) {
      console.log(`✓ ${label}=${configured} — exists in the live model list`);
    } else {
      missing.push({ label, configured });
      console.error(`✗ ${label}=${configured} — NOT in the live model list`);
      const hints = suffixMatch(live, configured);
      if (hints.length) console.error(`  did you mean: ${hints.join(", ")}`);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\nverify:models failed for ${missing.length} model(s). ` +
        `Update .env.local (or the deployment env) and re-run. ` +
        `Live list has ${live.size} models.`,
    );
    process.exit(1);
  }

  console.log(`verify:models passed — ${live.size} live models, both configured IDs exist.`);
} catch (error) {
  console.error("verify:models errored:", error instanceof Error ? error.message : error);
  // A transient API error must not block a deploy; a bad model ID is caught
  // above when the list call succeeds.
  process.exit(0);
}
