import { z } from "zod";

/**
 * Seed schemas. The seed data is validated at import time: if the content is
 * broken the app fails loudly in development rather than silently showing
 * half-populated careers to a student.
 */

export const educationLevelSchema = z.enum([
  "class8",
  "class10",
  "class12",
  "iti",
  "diploma",
  "graduate",
]);

export const dataQualitySchema = z.enum(["sourced", "estimated", "illustrative", "guidance"]);

export const workEnvironmentSchema = z.enum([
  "workshop",
  "factory",
  "field",
  "site",
  "lab",
  "healthcare",
  "office",
  "studio",
  "outdoor",
  "hospitality",
]);

export const interestSchema = z.object({
  slug: z.string().min(1),
  name_en: z.string().min(1),
  name_te: z.string().min(1),
  description_en: z.string().min(1),
});

export const skillSchema = z.object({
  slug: z.string().min(1),
  name_en: z.string().min(1),
  name_te: z.string().min(1),
  category: z.enum(["technical", "digital", "people", "safety", "business"]),
});

export const pathwayStageSchema = z.object({
  stage: z.number().int().positive(),
  type: z.enum([
    "training",
    "certification",
    "apprenticeship",
    "employment",
    "progression",
    "further_education",
  ]),
  title_en: z.string().min(1),
  title_te: z.string().min(1),
  duration_months: z.number().int().positive().nullable(),
  note_en: z.string().min(1),
  optional: z.boolean(),
});

export const careerSchema = z.object({
  slug: z.string().min(1),
  title_en: z.string().min(1),
  title_te: z.string().min(1),
  summary_en: z.string().min(1),
  summary_te: z.string().min(1),
  work_en: z.string().min(1),
  work_environment: workEnvironmentSchema,
  sector_fit: z.array(z.enum(["government", "private", "entrepreneurship"])).min(1),
  team_orientation: z.enum(["individual", "team", "either"]),
  min_education_level: educationLevelSchema,
  duration_months_min: z.number().int().positive(),
  duration_months_max: z.number().int().positive(),
  cost_band: z.enum(["low", "medium", "high"]),
  relocation_likelihood: z.enum(["low", "medium", "high"]),
  entrepreneurship: z.enum(["limited", "possible", "strong"]),
  income_band_min: z.number().int().nonnegative(),
  income_band_max: z.number().int().nonnegative(),
  factors: z.object({
    math: z.number().min(0).max(100),
    logical: z.number().min(0).max(100),
    mechanical: z.number().min(0).max(100),
    creativity: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    practical: z.number().min(0).max(100),
  }),
  skills: z
    .array(
      z.object({
        slug: z.string().min(1),
        level: z.number().min(0).max(100),
        priority: z.boolean(),
      }),
    )
    .min(1),
  interests: z
    .array(z.object({ slug: z.string().min(1), weight: z.number().min(0).max(1) }))
    .min(1),
  pathways: z.array(pathwayStageSchema).min(3),
  further_education_en: z.array(z.string().min(1)).min(1),
  considerations_en: z.array(z.string().min(1)).min(1),
  opportunities_en: z.array(z.string().min(1)).min(1),
  availability: z.array(
    z.object({ state: z.string().min(1), districts: z.array(z.string().min(1)).min(1) }),
  ),
  source_org: z.string().min(1),
  source_url: z.string().url(),
  data_quality: dataQualitySchema,
});

export const institutionSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["government_iti", "private_iti", "polytechnic", "training_centre", "skill_centre"]),
  state: z.string().min(1),
  district: z.string().min(1),
  address: z.string().min(1),
  website: z.string().url().nullable(),
  source_url: z.string().url(),
  data_quality: dataQualitySchema,
});

export const courseSchema = z.object({
  slug: z.string().min(1),
  institution_slug: z.string().min(1),
  career_slug: z.string().min(1),
  title_en: z.string().min(1),
  title_te: z.string().min(1),
  duration_months: z.number().int().positive(),
  cost_inr: z.number().int().nonnegative(),
  mode: z.enum(["residential", "non_residential", "online", "blended"]),
  eligibility_en: z.string().min(1),
  source_url: z.string().url(),
  data_quality: dataQualitySchema,
});

export const jobSchema = z.object({
  slug: z.string().min(1),
  career_slug: z.string().min(1),
  role_title_en: z.string().min(1),
  role_title_te: z.string().min(1),
  salary_min_inr: z.number().int().nonnegative(),
  salary_max_inr: z.number().int().nonnegative(),
  salary_period: z.literal("month"),
  region: z.string().min(1),
  employer_type: z.enum(["government", "private", "entrepreneurship"]),
  source_url: z.string().url(),
  data_quality: dataQualitySchema,
});

export const schemeSchema = z.object({
  slug: z.string().min(1),
  name_en: z.string().min(1),
  name_te: z.string().min(1),
  summary_en: z.string().min(1),
  eligibility_en: z.string().min(1),
  benefit_en: z.string().min(1),
  source_org: z.string().min(1),
  source_url: z.string().url(),
  verified_at: z.string().min(1),
});

export const questionOptionSchema = z.object({
  value: z.string().min(1),
  label_en: z.string().min(1),
  label_te: z.string().min(1),
  score: z.number().min(0).max(100),
});

export const questionSchema = z
  .object({
    id: z.string().min(1),
    code: z.string().min(1),
    dimension: z.enum(["interest", "aptitude", "skill", "practical", "preference", "constraint"]),
    target: z.string().min(1),
    type: z.enum(["scale", "single", "multi"]),
    text_en: z.string().min(1),
    text_te: z.string().min(1),
    helper_en: z.string().optional(),
    options: z.array(questionOptionSchema).optional(),
    reverse: z.boolean(),
    weight: z.number().positive(),
    order: z.number().int().positive(),
  })
  .refine((q) => q.type === "scale" || (q.options?.length ?? 0) > 1, {
    message: "single/multi questions must define at least two options",
    path: ["options"],
  });

export const documentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  source_org: z.string().min(1),
  source_url: z.string().url(),
  retrieved_at: z.string().min(1),
  license_note: z.string().min(1),
  locale: z.enum(["en", "te", "multi"]),
  data_quality: dataQualitySchema,
  career_slugs: z.array(z.string()),
  content: z.string().min(1),
});
