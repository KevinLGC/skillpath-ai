import careersRaw from "@/data/careers.json";
import coursesRaw from "@/data/courses.json";
import documentsRaw from "@/data/documents.json";
import institutionsRaw from "@/data/institutions.json";
import interestsRaw from "@/data/interests.json";
import jobsRaw from "@/data/jobs.json";
import questionsRaw from "@/data/questions.json";
import schemesRaw from "@/data/schemes.json";
import skillsRaw from "@/data/skills.json";
import type {
  AssessmentQuestion,
  Career,
  Course,
  Institution,
  Interest,
  JobOpportunity,
  KnowledgeDocument,
  Skill,
  GovernmentScheme,
} from "@/lib/types";
import {
  careerSchema,
  courseSchema,
  documentSchema,
  institutionSchema,
  interestSchema,
  jobSchema,
  questionSchema,
  schemeSchema,
  skillSchema,
} from "@/lib/data/schema";

/**
 * Seed data access. Every read goes through this module so the rest of the app
 * never touches the JSON files directly, and so seed integrity is validated once.
 */

function parseAll<T>(schema: { parse: (value: unknown) => T }, rows: unknown[], label: string): T[] {
  const out: T[] = [];
  for (const row of rows) {
    try {
      out.push(schema.parse(row));
    } catch (error) {
      throw new Error(
        `Seed validation failed in ${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return out;
}

export const careers: Career[] = parseAll(careerSchema, careersRaw as unknown[], "data/careers.json");
export const interests: Interest[] = parseAll(interestSchema, interestsRaw as unknown[], "data/interests.json");
export const skills: Skill[] = parseAll(skillSchema, skillsRaw as unknown[], "data/skills.json");
export const questions: AssessmentQuestion[] = parseAll(
  questionSchema,
  questionsRaw as unknown[],
  "data/questions.json",
).sort((a, b) => a.order - b.order);
export const institutions: Institution[] = parseAll(
  institutionSchema,
  institutionsRaw as unknown[],
  "data/institutions.json",
);
export const courses: Course[] = parseAll(courseSchema, coursesRaw as unknown[], "data/courses.json");
export const jobs: JobOpportunity[] = parseAll(jobSchema, jobsRaw as unknown[], "data/jobs.json");
export const schemes: GovernmentScheme[] = parseAll(schemeSchema, schemesRaw as unknown[], "data/schemes.json");
export const documents: KnowledgeDocument[] = parseAll(
  documentSchema,
  documentsRaw as unknown[],
  "data/documents.json",
);

/* ------------------------------------ lookups ------------------------------------ */

const careerIndex = new Map(careers.map((c) => [c.slug, c]));
const institutionIndex = new Map(institutions.map((i) => [i.slug, i]));
const skillIndex = new Map(skills.map((s) => [s.slug, s]));
const interestIndex = new Map(interests.map((i) => [i.slug, i]));

export function getCareer(slug: string): Career | undefined {
  return careerIndex.get(slug);
}

export function requireCareer(slug: string): Career {
  const career = careerIndex.get(slug);
  if (!career) throw new Error(`Unknown career slug: ${slug}`);
  return career;
}

export function getInstitution(slug: string): Institution | undefined {
  return institutionIndex.get(slug);
}

export function getSkill(slug: string): Skill | undefined {
  return skillIndex.get(slug);
}

export function getInterest(slug: string): Interest | undefined {
  return interestIndex.get(slug);
}

export function getSkillName(slug: string, locale: "en" | "te" = "en"): string {
  const skill = skillIndex.get(slug);
  if (!skill) return slug;
  return locale === "te" ? skill.name_te : skill.name_en;
}

export function getInterestName(slug: string, locale: "en" | "te" = "en"): string {
  const interest = interestIndex.get(slug);
  if (!interest) return slug;
  return locale === "te" ? interest.name_te : interest.name_en;
}

/* ------------------------------- joined collections ------------------------------- */

export interface CourseWithInstitution extends Course {
  institution: Institution | null;
}

/*
 * These joins are called inside `.map()` loops (e.g. the admin careers list), so
 * a full-array scan per call is O(N×M). Index by career slug once at module load
 * and the lookups become O(1).
 */
const coursesByCareer = new Map<string, CourseWithInstitution[]>();
for (const course of courses) {
  const list = coursesByCareer.get(course.career_slug) ?? [];
  list.push({ ...course, institution: institutionIndex.get(course.institution_slug) ?? null });
  coursesByCareer.set(course.career_slug, list);
}

const jobsByCareer = new Map<string, JobOpportunity[]>();
for (const job of jobs) {
  const list = jobsByCareer.get(job.career_slug) ?? [];
  list.push(job);
  jobsByCareer.set(job.career_slug, list);
}

export function coursesForCareer(careerSlug: string): CourseWithInstitution[] {
  return coursesByCareer.get(careerSlug) ?? [];
}

export function jobsForCareer(careerSlug: string): JobOpportunity[] {
  return jobsByCareer.get(careerSlug) ?? [];
}

export interface LocalOpportunityView {
  kind: "institution" | "course" | "job" | "training_centre";
  label: string;
  detail: string;
  quality: Course["data_quality"];
  sourceUrl: string;
}

/**
 * Local opportunities are derived from institutions, courses and jobs rather
 * than stored twice, so the data cannot drift apart.
 */
export function localOpportunities(input: {
  careerSlug?: string;
  state?: string;
  district?: string;
}): LocalOpportunityView[] {
  const { careerSlug, state, district } = input;
  const matches = (i: Institution) =>
    (!state || i.state === state) && (!district || i.district === district);

  const out: LocalOpportunityView[] = [];

  for (const institution of institutions.filter(matches)) {
    out.push({
      kind: institution.kind === "training_centre" || institution.kind === "skill_centre" ? "training_centre" : "institution",
      label: institution.name,
      detail: `${institution.district}, ${institution.state}`,
      quality: institution.data_quality,
      sourceUrl: institution.source_url,
    });
  }

  for (const course of courses) {
    if (careerSlug && course.career_slug !== careerSlug) continue;
    const institution = institutionIndex.get(course.institution_slug);
    if (!institution || !matches(institution)) continue;
    out.push({
      kind: "course",
      label: course.title_en,
      detail: `${institution.name} · ${course.duration_months} months`,
      quality: course.data_quality,
      sourceUrl: course.source_url,
    });
  }

  for (const job of jobs) {
    if (careerSlug && job.career_slug !== careerSlug) continue;
    if (district && !job.region.toLowerCase().includes(district.toLowerCase())) continue;
    if (state && !job.region.toLowerCase().includes(state.toLowerCase()) && !district) continue;
    out.push({
      kind: "job",
      label: job.role_title_en,
      detail: job.region,
      quality: job.data_quality,
      sourceUrl: job.source_url,
    });
  }

  return out;
}

const documentsForCareerCache = new Map<string, KnowledgeDocument[]>();

export function documentsForCareer(careerSlug: string): KnowledgeDocument[] {
  const cached = documentsForCareerCache.get(careerSlug);
  if (cached) return cached;
  // General documents (no career tag) apply everywhere; the rest must list this career.
  const result = documents.filter(
    (doc) => doc.career_slugs.length === 0 || doc.career_slugs.includes(careerSlug),
  );
  documentsForCareerCache.set(careerSlug, result);
  return result;
}

/* -------------------------------- seed integrity -------------------------------- */

export interface SeedIntegrityIssue {
  file: string;
  message: string;
}

/**
 * Referential checks across files. Runs in tests (and can be called from a
 * health route) — it catches the classic seed bug where a joined row points at
 * a career or skill that was renamed.
 */
export function checkSeedIntegrity(): SeedIntegrityIssue[] {
  const issues: SeedIntegrityIssue[] = [];
  const careerSlugs = new Set(careers.map((c) => c.slug));
  const skillSlugs = new Set(skills.map((s) => s.slug));
  const interestSlugs = new Set(interests.map((i) => i.slug));
  const institutionSlugs = new Set(institutions.map((i) => i.slug));

  for (const career of careers) {
    for (const s of career.skills) {
      if (!skillSlugs.has(s.slug)) issues.push({ file: "careers.json", message: `${career.slug} references unknown skill ${s.slug}` });
    }
    for (const i of career.interests) {
      if (!interestSlugs.has(i.slug)) issues.push({ file: "careers.json", message: `${career.slug} references unknown interest ${i.slug}` });
    }
    for (const stage of career.pathways) {
      if (stage.duration_months !== null && stage.duration_months > 60) {
        issues.push({ file: "careers.json", message: `${career.slug} pathway stage ${stage.stage} has an implausible duration` });
      }
    }
    if (career.duration_months_min > career.duration_months_max) {
      issues.push({ file: "careers.json", message: `${career.slug} duration min is greater than max` });
    }
    if (career.income_band_min > career.income_band_max) {
      issues.push({ file: "careers.json", message: `${career.slug} income band is inverted` });
    }
  }

  for (const course of courses) {
    if (!careerSlugs.has(course.career_slug)) issues.push({ file: "courses.json", message: `${course.slug} references unknown career ${course.career_slug}` });
    if (!institutionSlugs.has(course.institution_slug)) issues.push({ file: "courses.json", message: `${course.slug} references unknown institution ${course.institution_slug}` });
  }

  for (const job of jobs) {
    if (!careerSlugs.has(job.career_slug)) issues.push({ file: "jobs.json", message: `${job.slug} references unknown career ${job.career_slug}` });
  }

  for (const doc of documents) {
    for (const slug of doc.career_slugs) {
      if (!careerSlugs.has(slug)) issues.push({ file: "documents.json", message: `${doc.id} references unknown career ${slug}` });
    }
  }

  const seenSlugs = new Set<string>();
  for (const career of careers) {
    if (seenSlugs.has(career.slug)) issues.push({ file: "careers.json", message: `duplicate career slug ${career.slug}` });
    seenSlugs.add(career.slug);
  }

  const careerCount = new Set(careers.map((c) => c.slug)).size;
  if (careerCount < 20) {
    issues.push({ file: "careers.json", message: `expected at least 20 careers, found ${careerCount}` });
  }
  if (questions.length < 20) {
    issues.push({ file: "questions.json", message: `expected at least 20 questions, found ${questions.length}` });
  }

  return issues;
}
