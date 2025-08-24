/* mho/engine/normalize.ts */
export function normalize(form: any) {
  // Normalize units/enums/times here (kept minimal and safe)
  // Example: ensure HH:MM strings
  const fixTime = (t?: string) =>
    typeof t === "string" && /^\d{2}:\d{2}$/.test(t) ? t : undefined;

  const schedule = {
    wake: fixTime(form?.schedule?.wake) || "06:30",
    sleep: fixTime(form?.schedule?.sleep) || "22:30",
  };

  const locale = form?.locale === "hi" ? "hi" : "en";

  return {
    ...form,
    locale,
    schedule,
    lifestyle: { ...(form?.lifestyle || {}) },
    problems: Array.isArray(form?.problems) ? form.problems : [],
    symptoms: Array.isArray(form?.symptoms) ? form.symptoms : [],
  };
}
