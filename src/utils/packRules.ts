// src/utils/packRules.ts
// Pure inference of which packs should apply. Independent of pack JSON files.
// HealthPlan can use this list to show the "packs chip" and to fetch tips via ensurePacksLoaded() if available.

export type PacksInput = {
  chronic?: string[];
  concerns?: string[];
  goals?: string[];
  gender?: "male"|"female"|"other"|"";
  age?: number|null;
  womens?: { periodStartISO?: string|"" } | null;
};

export function matchPacks(input: PacksInput): string[] {
  const packs = new Set<string>();
  const c = new Set((input.chronic||[]).map(x=>x.toLowerCase()));
  const k = new Set((input.concerns||[]).map(x=>x.toLowerCase()));
  const g = new Set((input.goals||[]).map(x=>x.toLowerCase()));

  // Cardio-metabolic
  if (c.has("hypertension") || k.has("high bp")) packs.add("hypertension");
  if (c.has("diabetes") || c.has("prediabetes")) packs.add("diabetes");
  if (c.has("dyslipidemia")) packs.add("dyslipidemia");
  if (c.has("obesity") || g.has("weight_loss")) packs.add("weight_management");

  // Endocrine
  if (c.has("thyroid")) packs.add("thyroid");

  // Respiratory/Allergy
  if (c.has("asthma") || c.has("copd") || k.has("allergy")) packs.add("respiratory_allergy");

  // GI/Liver
  if (c.has("gerd/acidity") || k.has("acidity") || k.has("bloating") || k.has("constipation")) packs.add("gut_health");
  if (c.has("fatty liver")) packs.add("fatty_liver");

  // Neuro/Mental/Sleep
  if (c.has("depression") || c.has("anxiety") || k.has("low mood") || k.has("stress")) packs.add("mind_stress_sleep");
  if (k.has("poor sleep")) packs.add("sleep_hygiene");

  // Musculoskeletal
  if (c.has("back pain") || c.has("osteoarthritis") || k.has("knee pain")) packs.add("musculoskeletal");

  // Women’s
  if (c.has("pcos/pcod")) packs.add("pcos_pc od");
  if (c.has("pregnancy") || (input.gender==="female" && input.womens)) packs.add("pregnancy_wellness");

  // Role-based packs (optional extension)
  // e.g., students, night shift
  if (k.has("exam") || k.has("study") ) packs.add("student_exam");
  if (k.has("night shift") ) packs.add("night_shift");

  return Array.from(packs);
}
