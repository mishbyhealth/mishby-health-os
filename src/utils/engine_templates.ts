// src/utils/engine_templates.ts
// Assembles a plan from templates (Diet Family + Routine + Dosha + Packs).
// No UI dependency. Next step we’ll call this from HealthPlan.

import type { DietType, Cuisine, MealSlot, FoodItem } from "./dietLibrary";
import { getDietFamily, pickDishesForSlot, filterByDosha, applyAvoidCombos } from "./dietLibrary";
import { buildRoutineSchedule, type ScheduleBlock } from "./routineTemplates";
import { matchPacks } from "./packRules";

export type DoshaScores = { kapha:number; pitta:number; vata:number };
export type IntakeSummary = {
  dietType: DietType;
  cuisine: Cuisine | "Generic";
  archetypeTimes: { wake: string; leave?: string; return?: string; lunch?: string; dinner?: string; commuteMins?: number; breaks?: Array<{label:string;from:string;to:string}>; };
  chronic?: string[];
  concerns?: string[];
  goals?: string[];
  gender?: "male"|"female"|"other"|"";
  womens?: { periodStartISO?: string|"" } | null;
  doshaLabel: string;              // e.g., "Pitta-Vata"
};

export type PlanMeal = { slot: MealSlot; at?: string; items: FoodItem[]; notes?: string[] };
export type Plan = {
  metrics: { energyEstimateKcal?: number; };
  hydration: Array<{ at: string; label: string; meta?: any }>;
  movement: Array<{ at: string; label: string; minutes?: number }>;
  meals: PlanMeal[];
  tips: string[];
  schedule: ScheduleBlock[];
  packsApplied: string[];
  doshaLabel: string;
  readme: string;
};

// ---- Helpers ----
function estimateEnergyKcal(diet: DietType, goals?: string[]): number {
  const base = 2000; // crude placeholder
  if (goals?.includes("weight_loss")) return 1800;
  if (goals?.includes("muscle_gain")) return 2200;
  return base;
}

function avoidListForPacks(packs: string[]): string[] {
  const avoid: string[] = [];
  if (packs.includes("gut_health")) avoid.push("heavy_fried", "milk+fish");
  if (packs.includes("thyroid")) avoid.push("very_soy");
  if (packs.includes("hypertension")) avoid.push("high_salt");
  return avoid;
}

// ---- Core Assembler ----
export function assemblePlanFromTemplates(input: IntakeSummary): Plan {
  const family = getDietFamily(input.dietType, input.cuisine);
  const schedule = buildRoutineSchedule(input.archetypeTimes, { goal: input.goals?.[0] });

  // Packs to apply (independent of actual JSON tips availability)
  const packsApplied = matchPacks({
    chronic: input.chronic,
    concerns: input.concerns,
    goals: input.goals,
    gender: input.gender,
    womens: input.womens
  });

  const avoid = avoidListForPacks(packsApplied);

  // Compose meals per slot using family defaults, filtered by dosha and pack avoid-combos
  const slots: MealSlot[] = ["breakfast","midmorning","lunch","evening","dinner"];
  const meals: PlanMeal[] = slots.map(slot => {
    const base = pickDishesForSlot(input.dietType, input.cuisine, slot);
    const byDosha = filterByDosha(base, input.doshaLabel);
    const filtered = applyAvoidCombos(byDosha, avoid);
    const atTime = schedule.find(b => b.type==="meal" && labelMatchesSlot(b.label, slot))?.at;
    const notes: string[] = [];
    if (input.doshaLabel.toLowerCase().includes("pitta") && (slot==="lunch" || slot==="dinner")) notes.push("Prefer cooling spices (jeera, dhania, fennel).");
    if (input.doshaLabel.toLowerCase().includes("kapha") && slot==="breakfast") notes.push("Keep it light; add protein (moong, sprouts).");
    if (input.doshaLabel.toLowerCase().includes("vata") && slot==="dinner") notes.push("Warm, easy-to-digest dinner helps sleep.");
    return { slot, at: atTime, items: filtered.slice(0,3), notes };
  });

  // Extract hydration & movement from schedule
  const hydration = schedule.filter(b=> b.type==="hydration").map(b => ({ at: b.at, label: b.label, meta: b.meta }));
  const movement  = schedule.filter(b=> b.type==="movement").map(b => ({ at: b.at, label: b.label, minutes: 10 }));

  // Base + dosha + packs tips (small starter set; UI can add more)
  const tips: string[] = [];
  if (input.doshaLabel.toLowerCase().includes("pitta")) tips.push("Favor cooling foods/spices; avoid very spicy/oily meals.");
  if (input.doshaLabel.toLowerCase().includes("kapha")) tips.push("Prefer light, warm meals; include brisk walks daily.");
  if (input.doshaLabel.toLowerCase().includes("vata")) tips.push("Keep meals warm and regular; prioritize sleep routine.");
  if (packsApplied.includes("sleep_hygiene")) tips.push("Keep screens off 60 minutes before bed; dim lights after dinner.");
  if (packsApplied.includes("hypertension")) tips.push("Limit added salt; watch packaged snacks; hydrate evenly.");
  if (packsApplied.includes("diabetes")) tips.push("Walk 10–15 minutes after main meals; plate half veggies at lunch/dinner.");

  const readme = "Plan built from templates (Diet Family + Routine) with Dosha & Packs modifiers. Guidance only — not medical advice.";

  return {
    metrics: { energyEstimateKcal: estimateEnergyKcal(input.dietType, input.goals) },
    hydration, movement, meals, tips,
    schedule,
    packsApplied,
    doshaLabel: input.doshaLabel,
    readme
  };
}

function labelMatchesSlot(label: string, slot: MealSlot): boolean {
  const L = label.toLowerCase();
  if (slot==="midmorning") return L.includes("mid") || L.includes("chaas");
  if (slot==="evening") return L.includes("evening");
  return L.includes(slot);
}
