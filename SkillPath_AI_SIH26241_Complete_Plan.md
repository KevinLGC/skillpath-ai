# SIH 2026 — SIH26241 Complete Development Plan

> **Implementation status (2026-10-02): built.** This plan is now realised in
> this repository — 30 routes, 12 Supabase migrations (`supabase/migrations/`),
> 58 passing tests, clean `tsc --noEmit`, successful `next build`, and the §23
> demo story verified end-to-end. Sections corrected during implementation are
> marked **[as built]**: §10 (RAG), §26 (database), §32 (phases). See `README.md`
> for setup; `data/` holds the seed content the plan specifies.

## Problem Statement

**Ministry:** Ministry of Skill Development and Entrepreneurship (MSDE)

**Problem:** AI-Enabled Career Counselling and Family Decision-Support Platform for Vocational Education

**Problem ID:** SIH26241

**Category:** Software

**Theme:** Smart Education

---

# 1. Product Vision

## Product Name

**SkillPath AI**

### Tagline
**AI-Powered Vocational Career & Family Decision Support Platform**

The platform should help students:

> Discover strengths and interests → explore vocational careers → understand career pathways → identify skill gaps → discuss options with family → create an actionable roadmap.

This should be built as a **real product**, not just an AI chatbot.

---

# 2. Target Users

## Student

- Class 8–12 / school leaver
- Interested in vocational education
- Unsure which career fits their interests and abilities
- May have constraints related to budget, location, training duration, or work environment

## Parent / Family

Needs to understand:

- Career pathway
- Training requirements
- Cost
- Duration
- Work environment
- Career progression
- Further education possibilities
- Opportunities and considerations

## Counsellor

- Reviews student profiles
- Reviews assessment results
- Reviews AI recommendations
- Adds counselling notes
- Helps students make informed decisions

## Admin

- Manages careers
- Manages vocational courses
- Manages skills
- Manages institutions
- Manages career pathways
- Manages jobs
- Manages knowledge-base resources

---

# 3. Core Product

The most important feature is the:

## AI Career Decision Engine

Students complete an assessment covering:

### Interests

- Technology
- Machines
- Healthcare
- Design
- People
- Business
- Outdoor work

### Abilities

- Mathematics
- Communication
- Logical thinking
- Mechanical understanding
- Creativity
- Practical skills

### Preferences

- Office / field / workshop
- Individual / team
- Government / private / entrepreneurship
- Local / willing to relocate

### Constraints

- Family budget
- Preferred location
- Education duration
- Minimum desired income

The platform creates a structured student profile and compares it with career data.

---

# 4. Example Recommendation

Example student profile:

- Age: 17
- Location: Visakhapatnam
- Education: Class 12
- Interests: Machines + Technology
- Math: Strong
- Practical work: High
- Budget: Low

Example career matches:

1. Electric Vehicle Technician
2. Automotive Service Technician
3. CNC Machine Operator

The platform should explain:

## Why was this career recommended?

- Strong mechanical interest
- Practical orientation
- Interest in automobiles
- Compatible training duration
- Compatible stated budget
- Relevant career progression options

Do not simply let an LLM invent a percentage.

The application should calculate matching scores using structured factors.

---

# 5. Career Matching Engine

Use a transparent scoring system.

Example:

```text
Career Score =
Interest Match
+ Skill Match
+ Aptitude Match
+ Preference Match
+ Education Compatibility
+ Constraint Compatibility
```

Example weighting:

```text
Interest Match       25%
Skill Match          25%
Aptitude Match       20%
Preferences           10%
Education             10%
Constraints           10%
```

The exact weights should be configurable.

Every recommendation must provide an explanation.

Example:

### Match Explanation

**Strong alignment**

- Practical work preference
- Mechanical interest
- Electrical aptitude

**Considerations**

- Requires workshop-based work
- Some opportunities may require relocation

**Skills to improve**

- Electrical diagnostics
- EV safety
- Digital tools

---

# 6. Important Product Principle

The platform must NOT present AI as making the student's final career decision.

Use:

> **AI assists career decisions; it does not make decisions for the student.**

Recommendations should be explainable and editable.

Students should be able to change:

- Interests
- Preferences
- Budget
- Location
- Education goals

and see how recommendations change.

---

# 7. Family Decision-Support

This is one of the most important differentiating features.

Create a dedicated:

## Family View

If a student selects:

**Electric Vehicle Technician**

the family should see:

### Career Overview

- Training duration
- Training cost where sourced
- Work environment
- Required skills
- Career progression
- Further education options
- Opportunities
- Important considerations

Example pathway:

```text
Trainee
   ↓
EV Technician
   ↓
Senior Technician
   ↓
Workshop Supervisor
   ↓
Service Manager
```

The system should clearly label estimates and sourced facts.

---

# 8. Career Comparison

Allow students and families to compare multiple careers.

Example:

| Factor | EV Technician | CNC Operator | Electrician |
|---|---|---|---|
| Training | 1–2 yrs | 1–2 yrs | 1–2 yrs |
| Cost | ₹ | ₹₹ | ₹ |
| Practical Work | High | High | High |
| Work Environment | Workshop | Factory | Field |
| Further Growth | Yes | Yes | Yes |
| Entrepreneurship | Possible | Possible | Possible |

Do not declare an objectively "best" career.

Instead show:

> **Fit based on your stated preferences**

---

# 9. AI Career Counsellor

Build a context-aware AI counsellor.

It should understand the student's profile.

Example:

**Student:**

> I don't want to go to college. What can I do?

The AI can explain relevant vocational pathways based on the student's assessment.

Another example:

**Student:**

> My parents think ITI has no future.

The system should provide factual information about the relevant pathway, progression options, further education possibilities, and considerations.

The chatbot should not make unsupported guarantees.

---

# 10. RAG System

Use Retrieval-Augmented Generation.

Architecture:

```text
User Question
      ↓
Query Understanding
      ↓
Vector Search
      ↓
Relevant Documents
      ↓
LLM
      ↓
Grounded Answer
      ↓
Sources
```

Knowledge base can include:

- Vocational courses
- Qualifications
- Career pathways
- Skill requirements
- Training institutions
- Apprenticeships
- Government schemes
- Career information
- Official documents

Always show sources for grounded answers.

**[as built] Retrieval details (lib/rag/):**

- **Embedding dimension is locked** to `vector(1536)` (env `EMBEDDING_DIM`,
  default 1536) matching `gemini-embedding-001` with `outputDimensionality`.
  Changing it requires a migration **and** a full re-ingest; the ingest script
  fails loudly on a dimension mismatch rather than storing bad vectors.
- **Chunking** is deterministic (`lib/rag/chunk.ts`): sentence-boundaried,
  ~3200 chars target with 400 chars of overlap, ids of the form
  `<document>#<chunkIndex>` so citations resolve identically across vector and
  keyword paths. The ingest script imports this same file — one chunker, not two.
- **Task types** are explicit: `RETRIEVAL_DOCUMENT` at ingest, `RETRIEVAL_QUERY`
  at question time; vectors are L2-normalised before storage/search.
- **Similarity floor** is `RAG_MIN_SIMILARITY` (default 0.62 cosine) in the
  `match_document_chunks` RPC, top-`RAG_TOP_K` (default 6) results; the keyword
  floor is calibrated separately (`LEXICAL_MIN_SCORE = 0.34` plus ≥2 shared
  terms) because the two scores live on different scales.
- **Hybrid**: vector hits lead, keyword hits fill gaps, merged by reciprocal
  rank fusion on the shared chunk ids.
- **When nothing is retrieved:** the answer degrades to a truthful
  "knowledge base has no source for this" response with `uncertain` grounding —
  never a fabricated citation. When no model key is configured, answers are
  assembled from retrieved text only and labelled as such. The counsellor never
  goes silent, and never invents a source.

---

# 11. Regional Language Support

Initial languages:

- English
- Telugu

Possible later languages:

- Hindi
- Tamil
- Kannada
- Malayalam
- Marathi
- Bengali

Language support should cover:

- UI
- Assessment
- Career information
- AI counselling
- Family explanations
- Career roadmap

Example:

> "నాకు ఏ vocational career సరిపోతుంది?"

The AI should be able to respond in Telugu.

---

# 12. Student Dashboard

Suggested dashboard structure:

```text
SkillPath AI

Good evening 👋

Career Readiness
███████████████░░░ 78%

Recommended Careers

┌────────────────┐
│ EV Technician  │
│      91%       │
└────────────────┘

┌────────────────┐
│ CNC Operator   │
│      86%       │
└────────────────┘

Continue Assessment →

Career Roadmap

● Assessment
● Career Selection
○ Training
○ Certification
○ Apprenticeship
○ Employment
```

---

# 13. Main Application Pages

## Public

```text
/
├── Home
├── About
├── How It Works
├── Careers
├── Resources
└── Login
```

## Student

```text
/dashboard
/assessment
/results
/careers
/career/[id]
/compare
/roadmap
/ai-counsellor
/family
/profile
```

## Family

```text
/family/dashboard
/family/student-profile
/family/career-comparison
/family/questions
```

## Counsellor

```text
/counsellor/dashboard
/counsellor/students
/counsellor/student/[id]
/counsellor/recommendations
/counsellor/reports
```

## Admin

```text
/admin
/admin/careers
/admin/courses
/admin/institutions
/admin/jobs
/admin/resources
```

---

# 14. Skill Gap Analysis

For a selected career, show:

```text
YOUR SKILLS

Electrical        █████████░ 90%
Mechanical        ████████░░ 80%
Communication     ██████░░░░ 60%
Digital Skills    █████░░░░░ 50%

REQUIRED

Electrical        ██████████ 100%
Mechanical        █████████░ 90%
Communication     ███████░░░ 70%
Digital Skills    ███████░░░ 70%
```

Then generate:

## Recommended Learning Plan

1. Electrical fundamentals
2. EV fundamentals
3. Battery management
4. Diagnostics

---

# 15. Career Roadmap

Create a visual roadmap:

```text
YOU ARE HERE
      ↓
Class 12
      ↓
EV Course / ITI
      ↓
Certification
      ↓
Apprenticeship
      ↓
EV Technician
      ↓
Senior Technician
      ↓
Advanced Certification / Progression
```

The roadmap should adapt to the student's selected career.

---

# 16. Local Opportunity Feature

Ask:

> Where do you want to work?

Example:

**Andhra Pradesh → Visakhapatnam**

Show relevant:

- Vocational institutions
- Courses
- Apprenticeships
- Jobs
- Training centres

Use verified data wherever possible.

---

# 17. Family Decision Simulator

Allow families to understand a career pathway.

Example:

```text
TRAINING COST
₹35,000

ESTIMATED LIVING / TRANSPORT
₹20,000

TOTAL INITIAL COST
₹55,000
```

Clearly label numbers as:

- Official/sourced
- Estimated
- Illustrative demo data

Do not present demo figures as real current facts.

Timeline:

```text
Year 1
Training

Year 2
Certification + Apprenticeship

Year 3
Employment

Year 4+
Further certification / progression
```

---

# 18. Counsellor Dashboard

Example:

```text
Counsellor Dashboard

Students                  128
Assessments completed      94
Needs attention            17
Career plans created       72

Recent Students
─────────────────────────────
Rahul     Class 12    Completed
Anjali    Class 10    Pending
Arjun     Class 12    Needs Review
```

Student detail page:

```text
Student Profile

Aptitude
Interests
Skills
Constraints

AI Recommendations

1. EV Technician
2. Electrical Technician
3. CNC Operator

Counsellor Notes

[........................]

[Review Career Plan]
```

---

# 19. Explainability

Every recommendation should include:

## Why was this recommended?

Example:

### Strong alignment

- Practical work preference
- Mechanical interest
- Electrical aptitude

### Considerations

- Workshop-based work
- Possible relocation requirements

### Skills to improve

- Electrical diagnostics
- EV safety
- Digital tools

This makes the recommendation system more transparent.

---

# 20. Recommended Data Sources

For the real implementation, prioritize authoritative sources such as:

- Ministry of Skill Development and Entrepreneurship
- National Skill Development Corporation
- NCVET
- Skill India
- PSSCIVE
- State skill-development departments
- Official training institutions
- Official employment/career resources
- Government apprenticeship resources

Do not fill the knowledge base with random AI-generated facts.

Keep source metadata with each document.

---

# 21. MVP

Build these first.

## Student

- Login
- Profile
- Career assessment
- AI recommendation
- Career details
- Career comparison
- Skill-gap analysis
- Career roadmap
- AI counsellor

## Family

- Family dashboard
- Career comparison
- Training/cost explanation
- AI Q&A

## Counsellor

- Student list
- Student profile
- Recommendation review
- Notes

## AI

- Recommendation engine
- RAG chatbot
- Skill-gap analysis
- Roadmap generation

---

# 22. Advanced Features

After the MVP:

- Telugu/Hindi support
- Voice interaction
- Institution finder
- Job recommendations
- Apprenticeship recommendations
- Scholarship discovery
- Government scheme discovery
- PDF career report
- Counsellor analytics
- Parent/student shared decision room

---

# 23. SIH Demo Story

Do not simply show separate features.

Use one student story.

## Step 1

A Class 12 student signs up.

## Step 2

Student completes a 2–3 minute assessment.

## Step 3

System analyses:

```text
Interests
Skills
Aptitude
Preferences
Constraints
```

## Step 4

System produces relevant career pathways.

## Step 5

Student opens:

**EV Technician**

## Step 6

System shows:

- Why recommended
- Required skills
- Training
- Cost
- Career progression
- Skill gap
- Opportunities

## Step 7

Student clicks:

**Share with Family**

## Step 8

Parent opens Family View.

They see:

- What the career involves
- Training
- Skills
- Progression
- Further education
- Relevant considerations

## Step 9

Parent asks:

> Can my child continue education after this?

AI answers using the knowledge base and sources.

## Step 10

Generate:

# Family Career Decision Report

This should be the final demo moment.

---

# 24. Technical Architecture

```text
                    ┌──────────────────┐
                    │     STUDENT      │
                    └────────┬─────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │   Assessment     │
                   └────────┬─────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Student Profile    │
                  │ Skills             │
                  │ Interests          │
                  │ Preferences        │
                  │ Constraints        │
                  └─────────┬──────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │ Career Matching Engine │
               └────────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
       ┌─────────────────┐     ┌────────────────┐
       │ Career Database │     │ Labour/Skill   │
       │ Courses         │     │ Information    │
       │ Skills          │     │                │
       └────────┬────────┘     └───────┬────────┘
                │                      │
                └──────────┬───────────┘
                           ▼
                    ┌──────────────┐
                    │ RAG / LLM    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          Student       Family      Counsellor
              │            │            │
              └────────────┼────────────┘
                           ▼
                    Career Roadmap
```

---

# 25. Recommended Tech Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Recharts

## Backend

Use Supabase for:

- PostgreSQL
- Authentication
- Database
- Storage
- Row Level Security

## AI

- LLM API
- Server-side API routes
- RAG
- pgvector

## Deployment

- Vercel
- Supabase

Do not overcomplicate the architecture with unnecessary microservices.

---

# 26. Database

**[as built] Implemented tables** (`supabase/migrations/0001`–`0012`):

```text
profiles               identity + role; row created by auth trigger
assessments            answers/constraints/profile as jsonb (re-scoreable)
recommendations        score + engine_version + weights_version + payload
roadmaps               steps + you_are_here_index
share_links            token, scope, expiry, revocation
consent_records        written by trigger on share insert/revoke
counsellor_notes       the human review layer
chat_sessions          pinned profile snapshot per conversation
chat_messages          content, grounding level, sources, mode
reports                frozen decision-report snapshot (printable)
ai_usage               per-user daily quota counter
engine_config          versioned weights; active row seeded from §5
documents              knowledge base docs + provenance columns
document_chunks        vector(1536) + match_document_chunks RPC
```

Static seed content lives in `data/*.json` (careers, skills, interests,
questions, courses, institutions, jobs, schemes, documents) and is validated by
zod at import time plus `npm run seed:check` — it is read directly by the app,
not normalised into SQL tables. Every table has RLS enabled (migration 0012):
students see their own rows, staff see the caseload, knowledge base is
readable-when-signed-in, service-role writes bypass RLS for engine/ingestion.

Original proposal for reference:

```text
users
profiles
assessment_questions
assessment_answers
assessments
skills
interests
careers
career_skills
career_interests
courses
institutions
career_pathways
jobs
government_schemes
recommendations
roadmaps
family_profiles
chat_sessions
chat_messages
documents
```

Relationships:

```text
Student
   │
   ├── Assessment
   │
   ├── Skills
   │
   ├── Interests
   │
   └── Preferences
           │
           ▼
    Recommendation Engine
           │
           ▼
        Careers
           │
      ┌────┴─────┐
      ▼          ▼
 Training      Jobs
      │          │
      └────┬─────┘
           ▼
       Roadmap
```

---

# 27. AI Components

## AI Module 1 — Career Recommendation

Structured recommendation algorithm.

## AI Module 2 — Career Counsellor

LLM-based conversational assistant.

## AI Module 3 — RAG

Grounded career information retrieval.

## AI Module 4 — Skill Gap Analysis

Compare current skills against career requirements.

## AI Module 5 — Career Roadmap

Generate personalized learning and career progression steps.

---

# 28. Security

Implement:

- Supabase authentication
- Role-based access
- Row Level Security
- Separate student/family/counsellor permissions
- Server-side API keys
- Minimal personal-data collection
- Consent for family sharing
- Secure database policies

Because students may be minors, privacy should be treated as a core design requirement.

---

# 29. AI Safety

The platform should:

- Not guarantee salaries
- Not guarantee employment
- Not guarantee admission
- Not make decisions solely from academic marks
- Not discriminate based on protected characteristics
- Show reasoning
- Show uncertainty
- Allow user preferences to be changed
- Allow counsellor review

Recommended disclaimer:

> **AI provides guidance and does not replace professional career counselling.**

---

# 30. Vibe-Coding Stack

Recommended:

```text
Next.js
TypeScript
Tailwind
shadcn/ui
Supabase
PostgreSQL
LLM API
pgvector
Vercel
```

Avoid unnecessary:

- Microservices
- Kubernetes
- Docker
- Separate Python backend
- Complex ML models
- Multiple AI providers unless necessary

For an SIH prototype, one clean full-stack application is easier to build, test and demonstrate.

---

# 31. Project Folder Structure

```text
skillpath-ai/
│
├── app/
│   ├── page.tsx
│   ├── login/
│   ├── dashboard/
│   ├── assessment/
│   ├── careers/
│   ├── compare/
│   ├── roadmap/
│   ├── counsellor/
│   ├── family/
│   └── admin/
│
├── components/
│   ├── assessment/
│   ├── career/
│   ├── dashboard/
│   ├── family/
│   ├── counsellor/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── ai/
│   ├── rag/
│   ├── recommendation/
│   └── utils/
│
├── data/
│   ├── careers.json
│   ├── skills.json
│   └── questions.json
│
├── supabase/
│   ├── schema.sql
│   └── seed.sql
│
└── README.md
```

---

# 32. Development Phases

## Phase 1 — Foundation

Build:

- Next.js
- Supabase
- Authentication
- Database
- Roles
- UI system
- Navigation
- Demo data

## Phase 2 — Student System

Build:

- Profile
- Assessment
- Results
- Career recommendations

## Phase 3 — Career Intelligence

Build:

- Career database
- Matching algorithm
- Skill-gap analysis
- Career comparison
- Roadmap

## Phase 4 — AI

Build:

- AI counsellor
- RAG
- Sources
- Profile-aware answers

## Phase 5 — Family

Build:

- Family dashboard
- Career comparison
- Family questions
- Decision report

## Phase 6 — Counsellor

Build:

- Student management
- AI recommendations
- Review
- Notes
- Reports

## Phase 7 — Polish

Build:

- Mobile responsiveness
- Animations
- Charts
- Loading states
- Error handling
- Accessibility
- Demo data
- Final testing

---

### **[as built] Reconciled phase map**

Sections 33–36 contain four agent prompts while this section lists seven
phases; they map onto each other as follows (this is the map that was executed):

```text
§33 prompt (Foundation)      → Phase 1 + Phase 2
§34 prompt (Student + Careers) → Phase 2 + Phase 3
§35 prompt (AI + RAG)        → Phase 4
§36 prompt (Family)          → Phase 5
Phase 6 (Counsellor)         → §34's role surfaces, built alongside Phase 5
Phase 7 (Polish)             → hardening pass: typecheck, tests, build, §23 smoke
```

Order of execution followed §40's priority list: engine and student surfaces
first, family sharing and report next, counsellor/admin after, hardening last.

---

# 33. Coding Agent Prompt — Phase 1

Use this prompt first with Claude Code / Antigravity / another coding agent:

```text
You are a senior full-stack engineer and product designer.

We are building an SIH 2026 prototype for problem statement SIH26241:

"AI-Enabled Career Counselling and Family Decision-Support Platform for Vocational Education"

Product name:
SkillPath AI

Core purpose:
Help students discover suitable vocational career pathways using structured assessments and AI-assisted counselling, while giving families transparent information to understand and discuss those choices.

TECH STACK

- Next.js latest stable
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- pgvector for RAG
- LLM API through secure server-side API routes
- Vercel-ready architecture

USER ROLES

1. Student
2. Family/Parent
3. Counsellor
4. Admin

IMPORTANT PRODUCT PRINCIPLE

The LLM must not make the student's final career decision.

The system should provide explainable recommendations based on:
- interests
- aptitude
- skills
- preferences
- education
- location
- budget
- training duration preference
- work environment preference

Every recommendation must explain WHY it was recommended.

BUILD THE PROJECT AS A REAL PRODUCT, NOT A GENERIC AI CHATBOT.

FIRST PHASE ONLY

Do NOT implement every feature yet.

Build the foundation:

1. Next.js application structure
2. Professional modern UI
3. Responsive desktop/mobile design
4. Supabase integration
5. Authentication
6. Role-based routing
7. Database schema
8. Student profile
9. Basic dashboard
10. Navigation/sidebar
11. Theme system
12. Seed/demo data structure

DATABASE TABLES

profiles
assessment_questions
assessment_answers
assessments
skills
interests
careers
career_skills
career_interests
courses
institutions
career_pathways
jobs
recommendations
roadmaps
family_profiles
chat_sessions
chat_messages
documents

UI STYLE

Do NOT make it look like a generic AI-generated template.

Design it like a polished education/career SaaS product.

Use:
- clean typography
- excellent spacing
- subtle cards
- professional blue/indigo accent
- accessible contrast
- minimal gradients
- subtle animations
- clear data visualization
- mobile responsiveness

Do not overuse glassmorphism.

The dashboard should immediately communicate:
- student progress
- assessment status
- recommended careers
- career roadmap
- skill gaps

Create reusable components.

Use realistic Indian vocational education demo data.

Do not use fake government claims.

Keep external factual data clearly separated from demo/sample data.

Do not hardcode secrets.

Use environment variables.

Before coding:
1. Create architecture
2. Create database schema
3. Create route structure
4. Create component structure
5. Then implement

Do not add unnecessary libraries.

At the end provide:
- files created
- database tables
- environment variables required
- commands to run locally
- what is completed
- what should be built in Phase 2
```

---

# 34. Coding Agent Prompt — Phase 2

```text
Now implement the complete Student Career Assessment system.

Requirements:

1. Create a 20–25 question assessment.
2. Questions must measure:
   - interests
   - aptitude
   - practical orientation
   - communication
   - technology preference
   - work environment
   - entrepreneurship preference
   - education duration preference
   - location preference
   - budget constraints

3. Use structured scoring.

4. Do NOT ask an LLM to directly decide the score.

5. Store assessment answers in Supabase.

6. Generate a normalized student profile.

7. Implement a transparent career matching algorithm.

8. Match the student against the careers table.

9. Return the most relevant career pathways.

10. For every recommendation show:
    - match percentage
    - matching factors
    - missing skills
    - considerations
    - recommended next steps

11. Create a polished results dashboard.

12. Add career comparison.

13. Add skill-gap visualization.

14. Add career roadmap.

15. Seed at least 20 realistic vocational career pathways.

Make the recommendation engine modular so it can later incorporate RAG and labour-market data.

Do not use arbitrary/random percentages.

Explain the scoring logic in code comments and documentation.
```

---

# 35. Coding Agent Prompt — Phase 3: AI + RAG

```text
Now implement the AI Career Counsellor and RAG system.

Requirements:

1. Create a server-side AI service.
2. Never expose API keys to the browser.
3. Build a document ingestion structure.
4. Store document embeddings using pgvector.
5. Retrieve relevant documents for user questions.
6. Pass retrieved context to the LLM.
7. Require the AI to distinguish:
   - sourced facts
   - estimates
   - general guidance
   - uncertainty

8. Display sources used in responses.

9. Make the chatbot aware of the student's profile.

10. The chatbot should answer questions such as:
   - Which vocational career fits me?
   - What skills am I missing?
   - How long does this pathway take?
   - Can I continue education afterward?
   - What training options should I explore?
   - What are the differences between two careers?

11. Never guarantee:
   - salary
   - employment
   - admission
   - career success

12. Add a disclaimer:
   "AI provides guidance and does not replace professional career counselling."

13. Add conversation history.

14. Add a clear "Sources" section below grounded responses.
```

---

# 36. Coding Agent Prompt — Phase 4: Family

```text
Now implement the Family Decision-Support module.

The family module is a core feature, not an ordinary parent dashboard.

Student must be able to share a career plan with family.

Family view should show:

- student's selected career
- why it was recommended
- required skills
- training duration
- estimated costs where sourced
- career pathway
- further education options
- work environment
- potential opportunities
- skill gaps
- questions/concerns

Create a family-friendly interface with less technical language.

Add:

"Ask AI about this career"

Example questions:

- What does this career involve?
- What training is required?
- What are the progression options?
- Can my child study further?
- What skills should they develop?
- What factors should our family consider?

Do not tell the family which career they MUST choose.

Present multiple relevant pathways and explain trade-offs.

Create a shareable Career Decision Report.
```

---

# 37. Judge-Facing Technical Explanation

If judges ask:

## "Where is the AI?"

Explain:

```text
Assessment
      ↓
Feature extraction
      ↓
Recommendation algorithm
      ↓
Career knowledge base
      ↓
RAG retrieval
      ↓
LLM reasoning
      ↓
Personalized explanation
```

Important response:

> The LLM is only one component. Career matching is performed using structured student attributes and career metadata. The LLM is used for conversational counselling, explanation and grounded generation through RAG.

---

# 38. Final Product Positioning

The project should be presented as:

> **SkillPath AI is an explainable AI-powered vocational career decision-support ecosystem connecting students, families and counsellors through personalized assessments, career matching, skill-gap analysis, grounded AI counselling and actionable career pathways.**

Not simply:

> "An AI chatbot that recommends careers."

---

# 39. Final Demo Checklist

Before the SIH demo, verify:

### Student

- [ ] Registration works
- [ ] Login works
- [ ] Assessment works
- [ ] Results work
- [ ] Career recommendations work
- [ ] Explanation works
- [ ] Career details work
- [ ] Comparison works
- [ ] Skill gap works
- [ ] Roadmap works
- [ ] AI counsellor works

### Family

- [ ] Career plan can be shared
- [ ] Family dashboard works
- [ ] Career comparison works
- [ ] AI questions work
- [ ] Decision report works

### Counsellor

- [ ] Student list works
- [ ] Student profile works
- [ ] Recommendations visible
- [ ] Notes work
- [ ] Review workflow works

### AI

- [ ] API keys are secure
- [ ] RAG works
- [ ] Sources are displayed
- [ ] Hallucination controls are implemented
- [ ] AI disclaimer is displayed

### Technical

- [ ] Mobile responsive
- [ ] No console errors
- [ ] Database policies tested
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Demo data
- [ ] Deployment tested

---

# 40. Development Priority

If time becomes limited, prioritize:

```text
1. Student Assessment
2. Career Matching
3. Explainable Recommendations
4. Career Details
5. Skill Gap
6. Career Roadmap
7. Family View
8. AI Counsellor
9. RAG + Sources
10. Counsellor Dashboard
11. Advanced features
```

The first 8 should form the reliable demo path.

