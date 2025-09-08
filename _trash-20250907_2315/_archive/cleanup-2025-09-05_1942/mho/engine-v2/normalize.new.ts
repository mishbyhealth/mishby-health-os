/* mho2/engine-v2/normalize.ts */
import type { IntakeV2 } from "./types";

export function normalizeV2(input:any): IntakeV2 {
  const v = { ...(input||{}) };
  const out: IntakeV2 = v;
  out.meals = out.meals || {};
  if (out.meals.mealsPerDay==null) out.meals.mealsPerDay = 4;
  return out;
}