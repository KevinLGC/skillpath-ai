import type { RawAnswer, StudentConstraints } from "@/lib/types";

/**
 * Pure demo data — no engine, no seed.
 *
 * This module is imported by client components (the assessment runner's
 * "use demo answers" button), so it must stay free of anything that pulls the
 * scoring engine or the `@/lib/data` seed into the browser bundle. The
 * type-only imports above are erased at compile time and cost nothing.
 *
 * The profile itself is derived in `lib/demo/student.ts`, which is server-side.
 */

export const DEMO_STUDENT_ID = "demo-student-rahul";
export const DEMO_ASSESSMENT_ID = "demo-assessment-rahul";
export const DEMO_STUDENT_NAME = "Rahul";

export const DEMO_CONSTRAINTS: StudentConstraints = {
  budgetMaxInr: 30000,
  durationMaxMonths: 24,
  minIncomeInr: 14000,
  state: "Andhra Pradesh",
  district: "Visakhapatnam",
  hard: [],
};

export const DEMO_ANSWERS: RawAnswer[] = [
  { questionId: "q01", value: "5" }, // technology
  { questionId: "q02", value: "5" }, // machines
  { questionId: "q03", value: "2" }, // healthcare
  { questionId: "q04", value: "2" }, // design
  { questionId: "q05", value: "3" }, // people
  { questionId: "q06", value: "2" }, // business
  { questionId: "q07", value: "4" }, // outdoor
  { questionId: "q08", value: "5" }, // math
  { questionId: "q09", value: "4" }, // logical
  { questionId: "q10", value: "5" }, // mechanical
  { questionId: "q11", value: "3" }, // creativity
  { questionId: "q12", value: "3" }, // communication
  { questionId: "q13", value: "4" }, // electrical
  { questionId: "q14", value: "4" }, // mechanical skill
  { questionId: "q15", value: "3" }, // electronics
  { questionId: "q16", value: "3" }, // digital
  { questionId: "q17", value: "4" }, // hand tools
  { questionId: "q18", value: "2" }, // customer service
  { questionId: "q19", value: "5" }, // practical learning
  { questionId: "q20", value: "5" }, // fixes things himself
  { questionId: "q21", value: ["workshop", "field", "outdoor"] },
  { questionId: "q22", value: "either" },
  { questionId: "q23", value: "private" },
  { questionId: "q24", value: "maybe" },
];
