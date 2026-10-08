/**
 * Deterministic date formatting.
 *
 * `new Date(x).toLocaleDateString()` with no locale argument uses the *runtime's*
 * locale and timezone, so the server render and the client hydration can
 * disagree and React throws a hydration mismatch. Everything here pins an
 * explicit locale and timezone so both sides produce the same string.
 */

const LOCALE = "en-IN";
const TIME_ZONE = "Asia/Kolkata";

export function formatDate(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatDateTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** `YYYY-MM-DD` in IST — for filenames and other machine-readable stamps. */
export function formatDateStamp(value: string | number | Date = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
  return parts;
}
