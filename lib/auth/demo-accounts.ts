import { DEMO_STUDENT_ID, DEMO_STUDENT_NAME } from "@/lib/demo/student";

/** Seeded demo accounts so the SIH walkthrough never depends on sign-up flows. */
export const DEMO_ACCOUNTS = [
  {
    id: "demo-user-student",
    name: DEMO_STUDENT_NAME,
    role: "student" as const,
    email: "rahul@demo.skillpath.ai",
    studentId: DEMO_STUDENT_ID,
    description: "Class 12, Visakhapatnam · has completed the assessment",
  },
  {
    id: "demo-user-family",
    name: `${DEMO_STUDENT_NAME}'s parent`,
    role: "family" as const,
    email: "parent@demo.skillpath.ai",
    studentId: DEMO_STUDENT_ID,
    description: "Family view of the same student's plan",
  },
  {
    id: "demo-user-counsellor",
    name: "Priya (Counsellor)",
    role: "counsellor" as const,
    email: "counsellor@demo.skillpath.ai",
    studentId: null,
    description: "Sees assigned students, recommendations and notes",
  },
  {
    id: "demo-user-admin",
    name: "Platform Admin",
    role: "admin" as const,
    email: "admin@demo.skillpath.ai",
    studentId: null,
    description: "Manages careers, knowledge base and engine weights",
  },
];

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];

export function findDemoAccount(id: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((account) => account.id === id);
}
