/* mho2/engine-v2/validate.ts */
import type { IntakeV2 } from "./types";

export type ValidationIssue = { path: string; message: string };

export function validateV2(i: IntakeV2): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const w = i?.schedule?.wakeTime, s = i?.schedule?.sleepTime;
  if (w && s && w===s) issues.push({ path: "schedule.sleepTime", message: "Sleep time must differ from wake time." });
  const mpd = i?.meals?.mealsPerDay;
  if (mpd!=null && (mpd<3 || mpd>6)) issues.push({ path:"meals.mealsPerDay", message:"Meals per day should be 3–6." });
  const h = i?.body?.heightCm;
  if (h!=null && (h<50||h>250)) issues.push({ path:"body.heightCm", message:"Height must be 50–250 cm." });
  const wkg = i?.body?.weightKg;
  if (wkg!=null && (wkg<10||wkg>350)) issues.push({ path:"body.weightKg", message:"Weight must be 10–350 kg." });
  if (i?.repro?.pregnant && !i?.repro?.trimester) issues.push({ path:"repro.trimester", message:"Trimester is required if pregnant." });
  if (i?.goals?.goalEndDate && i?.goals?.goalStartDate && (new Date(i.goals.goalEndDate) < new Date(i.goals.goalStartDate))){
    issues.push({ path:"goals.goalEndDate", message:"End date must be after start date." });
  }
  return issues;
}