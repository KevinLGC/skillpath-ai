# SkillPath AI

Explainable AI-powered vocational career decision support for students, families and
counsellors. Built for SIH26241.

A student takes a short assessment; a **transparent scoring engine** (not a model)
ranks 21 vocational pathways and explains every point of the score; a grounded AI
counsellor answers questions from a curated knowledge base with sources; families get
an expiring, revocable share link and a printable decision report.

## Quick start (zero configuration)

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Try the demo**. Without any environment
variables the app runs on the local demo driver: seed data in `data/`, in-memory
writes, keyword-only retrieval. Every screen works; nothing is faked.

```bash
npm test          # 58 unit tests: engine, scoring, seed integrity, retrieval, i18n
npm run typecheck
npm run build
```

## Turning on the real services

Copy `.env.example` to `.env.local` and fill in what you need — each service is
independent, and the app degrades cleanly when one is missing:

| Missing | What you still get |
|---|---|
| Supabase keys | Local demo driver (seed data + in-memory writes) |
| `GEMINI_API_KEY` | Counsellor answers from retrieval only, same sources, marked as guidance |
| Both | Full §23 demo story, offline |

### Supabase (accounts, persistence, RLS)

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema: `supabase db push` (migrations `0001`–`0012` live in
   [`supabase/migrations`](supabase/migrations)) — includes pgvector, the
   `match_document_chunks` RPC, and row level security on every table.
3. Put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and
   `SUPABASE_SECRET_KEY` (server-only — never the publishable one) in `.env.local`.
4. Create users in the Supabase dashboard; a trigger writes their `profiles` row
   with the role from the signup metadata (`student` by default, or
   `counsellor` / `admin` / `family`).

The app switches from the demo driver to Postgres automatically — no code change.

### Gemini (AI counsellor + vector retrieval)

1. Get an API key, set `GEMINI_API_KEY` in `.env.local`.
2. `npm run verify:models` — confirms your configured model IDs exist in the live
   model list (model names move; this fails fast instead of at demo time).
3. `npm run ingest` — chunks `data/documents.json` with the *same* chunker the app
   uses (`lib/rag/chunk.ts`), embeds with `GEMINI_EMBED_MODEL`, writes
   `documents` + `document_chunks`. `npm run ingest:dry` previews without any API
   or database calls.

Retrieval is hybrid: vector search leads, keyword fills gaps, and keyword-only mode
is always available as the floor. The counsellor never goes silent.

## Architecture

```
app/                  Next.js 16 App Router — marketing, student app, roles, share, report
  api/                route handlers (assessment, chat, share, report, notes, auth, locale)
components/           UI: primitives, assessment runner, charts, chat, family, counsellor
lib/
  assessment/         answers → normalised profile (0–1 factors)
  recommendation/     the engine: weights, scoring, explanation traces  ← core claim
  rag/                chunking, retrieval (vector + keyword), answer assembly
  ai/                 provider interface (Gemini REST), quota, config
  db/                 Store interface: memory driver | supabase driver
  i18n/               English + Telugu
data/                 seed content: 21 careers, questions, skills, institutions, docs
supabase/migrations/  0001–0012: schema, pgvector, RLS, consent triggers
scripts/              verify-models.mjs, ingest-knowledge.mjs
```

Two rules the code enforces:

- **Every recommendation stores its engine version, weights version and factor
  trace**, so a score shown to a family last week can be reproduced and challenged.
- **The engine explains; the AI only narrates.** The LLM never produces a score.
  It answers questions from retrieved, cited documents and is instructed to say so
  when the knowledge base has no source.

Data provenance and quality (`sourced` / `estimated` / `illustrative` / `guidance`)
are shown next to every number. Compliance note: student data is minimised — no
personal identifiers are sent to the model — and family sharing is consent-gated
(the consent row is written by a database trigger, see `0006_share_links.sql`).

## Deploy (Vercel)

1. Import the repo; framework preset: Next.js (auto-detected).
2. Set the env vars from `.env.example` in Project → Settings → Environment
   Variables. `SUPABASE_SECRET_KEY` is server-only; never expose it to the client.
3. Apply migrations once against the production Supabase project and run
   `npm run ingest` there too.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed URL so share links resolve.
5. Run `npm run verify:models` against production env before announcing.

## Demo story (plan §23)

1. Landing → **Try the demo** (student, Class 12, Visakhapatnam, low budget).
2. Results: ranked pathways with the factor radar and per-factor explanations.
3. Compare two careers → skill gap → roadmap with "you are here".
4. AI counsellor: ask about ITI vs diploma; sources are listed per answer.
5. Family: create an expiring share link (consent recorded), open it logged-out,
   generate the printable decision report.
6. Counsellor login: roster, notes. Admin: engine weights, content status.

All of this runs with no environment variables.
