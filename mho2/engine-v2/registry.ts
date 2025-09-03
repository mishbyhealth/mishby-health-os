/**
 * Engine V2 Registry (V4)
 * Implements your DATA PROCESSING ENGINE + HEALTH PLAN GENERATOR (neutral).
 * Public API stays compatible with existing pages:
 *   - export function normalize(intake)
 *   - export function stitch(normalized)
 * Also provides a convenience: export function buildPlan(intake)
 *
 * NOTE: This is a safe, neutral planner. It does NOT provide medical advice.
 */

export type Intake = any; // kept broad to avoid compile friction with app-level types

/* ------------------------- Utility helpers ------------------------- */

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function toHHMM(totalMin: number): string {
  const m = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* ------------------------- 1) Profile Normalizer ------------------------- */

type NormalizedProfile = {
  age: number;
  sex: "male" | "female" | "other";
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bsa_m2: number;
  age_group: "child" | "adult" | "senior";
  timezone?: string;
  language?: string;
  region_state?: string;
};

type Labs = {
  potassium_mmol_L?: number;
  sodium_mmol_L?: number;
  creatinine_mg_dL?: number;
  eGFR?: number;
  fasting_glucose_mg_dL?: number;
  A1c_percent?: number;
  LDL?: number;
  BP_avg_systolic?: number;
  BP_avg_diastolic?: number;
};

type Preferences = {
  detail_level?: "basic" | "standard" | "advanced";
  veg_only?: boolean;
  spice_tolerance?: number; // 0-10
};

type Constraints = {
  nutrient_limits: {
    kcal?: number;
    protein_g?: { min?: number; max?: number };
    fat_g?: { max?: number };
    carb_g?: { max?: number };
    fiber_g?: { min?: number };
    potassium_mg?: { max?: number };
    phosphorus_mg?: { max?: number };
    sodium_mg?: { max?: number };
    sugar_g?: { max?: number };
  };
  food_tags: {
    allow: string[];
    limit: string[];
    avoid: string[];
  };
  fluid_cap_L_per_day?: number;
  activity_rules: string[];
  notes: string[]; // safety notes, explanations
};

type Normalized = {
  profile: NormalizedProfile;
  labs: Labs;
  conditions: { system: string; condition: string; stage?: string }[];
  meds: { classes: string[]; notes?: string } | undefined;
  allergies: { items: string[]; notes?: string } | undefined;
  diet: {
    pattern?: string[];
    religious_rules?: string[];
    fasting_practices?: string[];
    dislikes?: string[];
  };
  env: {
    cuisine_pref: string[];
    budget_level?: "low" | "mid" | "high";
    cook_skill?: "beginner" | "intermediate" | "advanced";
    prep_time_min_per_meal?: number;
  };
  activity: { level?: "light" | "moderate"; step_goal?: number; posture_issues?: string[] };
  hydration: { fluid_cap_L_per_day?: number };
  windows: {
    wake_time?: string;
    sleep_time?: string;
    meal_windows?: { start: string; end: string }[];
    work_slots?: { start: string; end: string }[];
    prayer_slots?: string[];
  };
  devices: string[];
  prefs: Preferences;
  meals_per_day: number;
  meal_times: string[];
};

export function normalize(intake: Intake): Normalized {
  // Basic guards
  const pb = intake?.profile_basics ?? {};
  const h = Number(pb.height_cm ?? 0);
  const w = Number(pb.weight_kg ?? 0);
  const age = Number(pb.age ?? 30);
  const sex = pb.sex ?? "other";

  const heightM = h > 0 ? h / 100 : 1.6;
  const bmi = w > 0 && heightM > 0 ? w / (heightM * heightM) : 22;
  // Dubois BSA approx
  const bsa_m2 = 0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725);

  const age_group: NormalizedProfile["age_group"] =
    age < 18 ? "child" : age >= 60 ? "senior" : "adult";

  const profile: NormalizedProfile = {
    age,
    sex,
    height_cm: h,
    weight_kg: w,
    bmi,
    bsa_m2,
    age_group,
    timezone: intake?.contact_locale?.timezone,
    language: intake?.contact_locale?.language,
    region_state: intake?.contact_locale?.region_state,
  };

  const labs: Labs = { ...(intake?.recent_labs || {}) };
  // Conservative imputations (example only; neutral)
  if (labs.potassium_mmol_L == null) labs.potassium_mmol_L = 4.5;
  if (labs.sodium_mmol_L == null) labs.sodium_mmol_L = 140;

  const normalized: Normalized = {
    profile,
    labs,
    conditions: (intake?.diagnosed_conditions || []).map((c: any) => ({
      system: c.system || "",
      condition: c.condition || "",
      stage: c.stage || undefined,
    })),
    meds: intake?.medications?.classes?.length ? intake.medications : undefined,
    allergies: intake?.allergies?.items?.length ? intake.allergies : undefined,
    diet: {
      pattern: intake?.dietary_pattern?.pattern || [],
      religious_rules: intake?.dietary_pattern?.religious_rules || [],
      fasting_practices: intake?.dietary_pattern?.fasting_practices || [],
      dislikes: intake?.dietary_pattern?.dislikes || [],
    },
    env: {
      cuisine_pref: intake?.food_environment?.cuisine_pref || [],
      budget_level: intake?.food_environment?.budget_level,
      cook_skill: intake?.food_environment?.cook_skill,
      prep_time_min_per_meal: Number(intake?.food_environment?.prep_time_min_per_meal ?? 30),
    },
    activity: {
      level: intake?.activity_tolerance?.level,
      step_goal: Number(intake?.activity_tolerance?.step_goal ?? 4000),
      posture_issues: intake?.activity_tolerance?.posture_issues || [],
    },
    hydration: {
      fluid_cap_L_per_day:
        intake?.hydration_guidance?.fluid_cap_L_per_day != null
          ? Number(intake.hydration_guidance.fluid_cap_L_per_day)
          : undefined,
    },
    windows: {
      wake_time: intake?.daily_time_windows?.wake_time || "06:30",
      sleep_time: intake?.daily_time_windows?.sleep_time || "22:30",
      meal_windows: intake?.daily_time_windows?.meal_windows || [],
      work_slots: intake?.daily_time_windows?.work_slots || [],
      prayer_slots: intake?.daily_time_windows?.prayer_slots || [],
    },
    devices: intake?.monitoring_devices || [],
    prefs: {
      detail_level: intake?.plan_preference?.detail_level || "standard",
      veg_only: !!intake?.plan_preference?.veg_only,
      spice_tolerance: clamp(Number(intake?.plan_preference?.spice_tolerance ?? 5), 0, 10),
    },
    meals_per_day: clamp(Number(intake?.meals_per_day ?? 3), 2, 6),
    meal_times:
      Array.isArray(intake?.meal_times) && intake.meal_times.length
        ? intake.meal_times
        : ["08:00", "13:00", "19:30"],
  };

  return normalized;
}

/* -------------------- 2) Condition Packs Resolver -------------------- */

function buildConstraintPacks(norm: Normalized): Constraints {
  const c: Constraints = {
    nutrient_limits: {},
    food_tags: { allow: [], limit: [], avoid: [] },
    fluid_cap_L_per_day: norm.hydration.fluid_cap_L_per_day,
    activity_rules: [],
    notes: [],
  };

  // Base neutral defaults
  c.nutrient_limits.sodium_mg = { max: 2000 };
  c.nutrient_limits.sugar_g = { max: 30 };
  c.nutrient_limits.fiber_g = { min: 20 };

  // Conditions
  for (const cond of norm.conditions) {
    const name = (cond.condition || "").toLowerCase();

    if (name.includes("ckd") || name.includes("chronic kidney")) {
      // Example CKD constraints (neutral placeholders)
      c.nutrient_limits.potassium_mg = { max: 2500 };
      c.nutrient_limits.phosphorus_mg = { max: 800 };
      if (!c.fluid_cap_L_per_day) c.fluid_cap_L_per_day = 1.8;
      c.food_tags.avoid.push("salt_substitutes_potassium");
      c.activity_rules.push("Prefer gentle walks; avoid heavy straining if fatigued.");
      c.notes.push("Kidney support: cautious potassium/phosphorus; watch fluids if advised.");
      if ((cond.stage || "").match(/ckd[-\s]?4|ckd[-\s]?5/i)) {
        c.nutrient_limits.protein_g = { max: 0.8 * norm.profile.weight_kg };
      }
    }

    if (name.includes("hypertension") || name.includes("high bp")) {
      c.nutrient_limits.sodium_mg = { max: Math.min(1500, c.nutrient_limits.sodium_mg?.max ?? 1500) };
      c.notes.push("Blood pressure support: earlier dinner; avoid added salt after 19:00.");
    }

    if (name.includes("diabetes")) {
      c.nutrient_limits.carb_g = { max: 180 };
      c.notes.push("Glycemic support: steady carbs; prefer low-GI grains and pulses.");
    }

    if (name.includes("prostate")) {
      c.activity_rules.push("Stand up slowly if dizzy; include gentle pelvic floor exercises if comfortable.");
    }
  }

  // Medications
  const medClasses = norm.meds?.classes?.map((s) => s.toLowerCase()) || [];
  if (medClasses.some((m) => m.includes("acei") || m.includes("arb"))) {
    // Stricter K cap with ACEi/ARB
    const currentKMax = c.nutrient_limits.potassium_mg?.max ?? 3000;
    c.nutrient_limits.potassium_mg = { max: Math.min(currentKMax, 2500) };
    c.notes.push("Medication guard: ACEi/ARB present → cautious potassium.");
    c.food_tags.avoid.push("salt_substitutes_potassium");
  }
  if (medClasses.some((m) => m.includes("diuretic"))) {
    c.notes.push("Medication guard: diuretic present → be mindful of sodium and hydration timing.");
  }
  if (medClasses.some((m) => m.includes("alpha-blocker"))) {
    c.notes.push("Medication guard: risk of orthostatic hypotension → stand slowly, evening salt caution.");
  }

  // Preferences & dietary pattern
  if (norm.prefs.veg_only) c.food_tags.avoid.push("non_veg");
  for (const rule of norm.diet.religious_rules || []) {
    if (rule.toLowerCase().includes("no onion")) c.food_tags.avoid.push("onion");
    if (rule.toLowerCase().includes("no garlic")) c.food_tags.avoid.push("garlic");
  }

  return c;
}

/* ---------------- Nutrient Targets Generator (neutral) ---------------- */

type Targets = {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g_min: number;
  potassium_max?: number;
  phosphorus_max?: number;
  sodium_max?: number;
  sugar_max?: number;
};

function calcTargets(norm: Normalized, c: Constraints): Targets {
  const { profile, activity } = norm;
  // Simple energy estimate (neutral placeholder): 24 * weight * factor
  const factor = (activity.level === "moderate" ? 1.5 : 1.3);
  const kcal = Math.round(24 * profile.weight_kg * factor);

  // Protein: default 0.9 g/kg unless CKD cap applied
  const baseProtein = 0.9 * profile.weight_kg;
  const proteinCap = c.nutrient_limits.protein_g?.max ?? baseProtein;
  const protein_g = Math.min(baseProtein, proteinCap);

  // Macros split (neutral, not prescriptive)
  const fat_g = Math.round((0.30 * kcal) / 9);
  const carb_g = Math.round((kcal - protein_g * 4 - fat_g * 9) / 4);

  return {
    kcal,
    protein_g: Math.max(40, Math.round(protein_g)),
    fat_g,
    carb_g,
    fiber_g_min: c.nutrient_limits.fiber_g?.min ?? 20,
    potassium_max: c.nutrient_limits.potassium_mg?.max,
    phosphorus_max: c.nutrient_limits.phosphorus_mg?.max,
    sodium_max: c.nutrient_limits.sodium_mg?.max,
    sugar_max: c.nutrient_limits.sugar_g?.max,
  };
}

/* ------- Hydration Scheduler & Activity/Yoga Recommender (neutral) ------- */

type ScheduleBlock = { time: string; label: string };

function buildHydrationSchedule(norm: Normalized, c: Constraints): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  const capL = c.fluid_cap_L_per_day ?? 2.0;
  const portions = Math.max(3, Math.min(8, norm.meals_per_day + 2)); // spread across day
  const perPortionMl = Math.round((capL * 1000) / portions);

  const wake = norm.windows.wake_time || "06:30";
  const sleep = norm.windows.sleep_time || "22:30";
  const daySpan = Math.max(240, toMinutes(sleep) - toMinutes(wake)); // min 4h
  const step = Math.floor(daySpan / (portions + 1));

  for (let i = 1; i <= portions; i++) {
    const t = toHHMM(toMinutes(wake) + i * step);
    blocks.push({ time: t, label: `Hydration ~${perPortionMl} ml` });
  }
  return blocks;
}

function buildActivityBlocks(norm: Normalized, c: Constraints): ScheduleBlock[] {
  const level = norm.activity.level || "light";
  const walk = level === "moderate" ? 15 : 10;
  const times = ["07:00", "13:30", "19:30"].slice(0, Math.min(3, norm.meals_per_day));
  const blocks: ScheduleBlock[] = times.map((t) => ({
    time: t,
    label: `Gentle walk ${walk} min; simple breathing`,
  }));
  if (c.activity_rules.length) {
    blocks.push({ time: "Any", label: c.activity_rules[0] });
  }
  return blocks;
}

/* --------- Food Graph / Portion Optimizer: neutral placeholders --------- */

function buildMealLines(norm: Normalized, targets: Targets, c: Constraints): string[] {
  // Neutral, culturally friendly placeholders respecting veg-only and sodium/sugar moderation
  const vegOnly = !!norm.prefs.veg_only;
  const cuisine = (norm.env.cuisine_pref[0] || "Indian");

  const baseMeals: string[] = [];
  for (let i = 0; i < norm.meals_per_day; i++) {
    const when = norm.meal_times[i] || "12:00";
    const items: string[] = [];

    // Grains / roti
    items.push("Roti (atta) 2 pcs or steamed rice 1 cup (choose low-salt cooking)");

    // Protein / dal
    items.push("Dal/soup 1 cup or sprouts 1 cup");

    // Veg rotation
    items.push("Seasonal cooked veg 1–2 cups (low salt, low oil)");

    // Sides
    items.push("Curd 1/2 cup (if tolerated) or chutney (low salt)");

    // Non-veg conditional
    if (!vegOnly && i !== 0) {
      items.push("Optional: small fish/egg portion if part of routine (avoid if restricted)");
    }

    // Time-specific cue
    baseMeals.push(`${when} — ${items.join(" • ")}`);
  }

  // Simple sodium/potassium hint
  const extraNotes: string[] = [];
  if ((c.nutrient_limits.sodium_mg?.max ?? 0) <= 1500) {
    extraNotes.push("No added salt after 19:00; avoid packaged salty snacks.");
  }
  if ((c.nutrient_limits.potassium_mg?.max ?? 9999) <= 2500) {
    extraNotes.push("Prefer lower-potassium veg; avoid salt substitutes with potassium.");
  }

  return baseMeals.concat(extraNotes.map((n) => `Note — ${n}`));
}

/* ------------------- 3) Stitch → Final Neutral Plan ------------------- */

export type PlanSection = { title: string; items: string[] };
export type Plan = {
  hydration: PlanSection;
  movement: PlanSection;
  meals: PlanSection;
  tips: PlanSection;
  metrics?: { bmi?: number; energyEstimateKcal?: number };
  schedule?: ScheduleBlock[];
};

export function stitch(norm: Normalized): Plan {
  const constraints = buildConstraintPacks(norm);
  const targets = calcTargets(norm, constraints);

  const mealLines = buildMealLines(norm, targets, constraints);

  // Hydration & movement blocks
  const hydrationBlocks = buildHydrationSchedule(norm, constraints);
  const activityBlocks = buildActivityBlocks(norm, constraints);

  // Merge schedule timeline
  const schedule: ScheduleBlock[] = [
    ...hydrationBlocks,
    ...activityBlocks,
    ...norm.meal_times.map((t) => ({ time: t, label: "Meal window" })),
  ].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  const plan: Plan = {
    hydration: {
      title: "Hydration",
      items: hydrationBlocks.map((b) => `${b.time} — ${b.label}`),
    },
    movement: {
      title: "Movement & Breathing",
      items: activityBlocks.map((b) => `${b.time} — ${b.label}`),
    },
    meals: {
      title: `Meals (${norm.meals_per_day}/day)`,
      items: mealLines,
    },
    tips: {
      title: "Tips & Safety Notes",
      items: [
        "Neutral, supportive guidance only; not a medical prescription.",
        ...constraints.notes,
        ...(norm.diet.fasting_practices?.length
          ? ["Fasting days: prefer simple swaps that fit your practice; keep fluids within advised limits."]
          : []),
      ],
    },
    metrics: {
      bmi: Number(norm.profile.bmi?.toFixed?.(1) ?? norm.profile.bmi),
      energyEstimateKcal: targets.kcal,
    },
    schedule,
  };

  return plan;
}

/* ---------------- Convenience: buildPlan(intake) ---------------- */

export function buildPlan(intake: Intake): Plan {
  const n = normalize(intake);
  return stitch(n);
}

// Backward-compat exports already provided (normalize, stitch).
