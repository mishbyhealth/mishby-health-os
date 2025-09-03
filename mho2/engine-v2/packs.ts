// mho2/engine-v2/packs.ts
// Minimal scaffold for condition packs (no engine wiring yet)

import hypertension from "../../data/packs/hypertension.json";
import diabetes from "../../data/packs/diabetes.json";

export type Range = { min?: number; max?: number };
export type NutrientBounds = {
  // examples; expand as needed
  sodium_mg?: Range;
  carbs_g_per_meal?: Range;
  [k: string]: Range | undefined;
};

export type ConditionPack = {
  id: string;
  title: string;
  priority: number; // higher = stronger precedence
  hydrationCapMlPerDay?: number;
  nutrientBounds?: NutrientBounds;
  allowTags?: string[];
  limitTags?: string[];
  avoidTags?: string[];
  activityCaveats?: string[];
  tips?: string[];
};

// Registry of available packs
export const PACKS: Record<string, ConditionPack> = {
  hypertension,
  diabetes,
};

// Normalize strings (e.g., "Hypertension" -> "hypertension")
function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * Try to infer relevant packs from intake.
 * Expected intake shape is flexible; we only read common fields:
 *   - intake.conditions: string[] | { name: string }[]
 */
export function getPacksForIntake(intake: any): ConditionPack[] {
  try {
    const names: string[] = [];

    // Array of strings or objects with name
    const conds = (intake?.conditions ?? []) as any[];
    for (const c of conds) {
      const n = typeof c === "string" ? c : c?.name;
      if (!n) continue;
      names.push(norm(n));
    }

    // Map common synonyms to our pack ids
    const wanted = new Set<string>();
    for (const n of names) {
      if (n.includes("hypertension") || n.includes("high bp") || n.includes("high blood pressure")) {
        wanted.add("hypertension");
      }
      if (n.includes("diabetes") || n.includes("type 2") || n === "t2dm") {
        wanted.add("diabetes");
      }
    }

    const list: ConditionPack[] = [];
    for (const id of wanted) {
      const pack = PACKS[id];
      if (pack) list.push(pack);
    }

    // Sort by priority (desc)
    return list.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  } catch {
    return [];
  }
}

/**
 * Merge helper (not used yet): combine bounds and arrays.
 * Priority rule: higher priority wins when conflicting.
 */
export function mergePacks(packs: ConditionPack[]): ConditionPack {
  const base: ConditionPack = {
    id: "merged",
    title: "Merged Packs",
    priority: 0,
    nutrientBounds: {},
    allowTags: [],
    limitTags: [],
    avoidTags: [],
    activityCaveats: [],
    tips: [],
  };

  for (const p of packs) {
    // hydration cap: choose the smallest (safest)
    if (p.hydrationCapMlPerDay != null) {
      const current = base.hydrationCapMlPerDay;
      base.hydrationCapMlPerDay =
        current == null ? p.hydrationCapMlPerDay : Math.min(current, p.hydrationCapMlPerDay);
    }

    // nutrient bounds: intersect ranges
    if (p.nutrientBounds) {
      base.nutrientBounds = base.nutrientBounds ?? {};
      for (const key of Object.keys(p.nutrientBounds)) {
        const r = p.nutrientBounds[key]!;
        const existing = base.nutrientBounds[key] ?? {};
        base.nutrientBounds[key] = {
          min: Math.max(existing.min ?? -Infinity, r.min ?? -Infinity),
          max: Math.min(existing.max ?? Infinity, r.max ?? Infinity),
        };
      }
    }

    // set unions
    base.allowTags = Array.from(new Set([...(base.allowTags ?? []), ...(p.allowTags ?? [])]));
    base.limitTags = Array.from(new Set([...(base.limitTags ?? []), ...(p.limitTags ?? [])]));
    base.avoidTags = Array.from(new Set([...(base.avoidTags ?? []), ...(p.avoidTags ?? [])]));

    base.activityCaveats = [
      ...(base.activityCaveats ?? []),
      ...(p.activityCaveats ?? []),
    ];
    base.tips = [...(base.tips ?? []), ...(p.tips ?? [])];
  }

  return base;
}
