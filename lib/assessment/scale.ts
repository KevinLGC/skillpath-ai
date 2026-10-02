import type { QuestionOption } from "@/lib/types";

/**
 * The shared 5-point scale used by every "scale" question. Keeping it in one
 * place means the rubric cannot drift between questions, and it keeps the seed
 * file focused on content rather than repeated option sets.
 */
export const DEFAULT_SCALE_OPTIONS: QuestionOption[] = [
  { value: "1", label_en: "Not at all", label_te: "అస్సలు కాదు", score: 20 },
  { value: "2", label_en: "A little", label_te: "కొద్దిగా", score: 40 },
  { value: "3", label_en: "Somewhat", label_te: "కొంతవరకు", score: 60 },
  { value: "4", label_en: "Quite a bit", label_te: "చాలా వరకు", score: 80 },
  { value: "5", label_en: "Very much", label_te: "చాలా ఎక్కువ", score: 100 },
];

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;
