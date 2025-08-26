// mho/engine/index.ts
// Minimal stub — now shaped for PDF exporter compatibility.

import diabetes from "../rules/conditions/diabetes.json";
import ckd from "../rules/conditions/ckd.json";
import high_bp from "../rules/conditions/high_bp.json";
import safety from "../rules/safety.global.json";

type AnyObj = Record<string, any>;

function asStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return [String(v)];
}
function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function pickMatches(conds: string[]) {
  const lc = conds.map((c) => c.toLowerCase().trim());
  const hits: AnyObj[] = [];
  const check = (rule: AnyObj) => {
    const anyOf: string[] = asStringArray(rule?.match?.anyOf);
    if (anyOf.length === 0) return false;
    return anyOf.some((k) => lc.includes(String(k).toLowerCase()));
  };
  if (check(diabetes)) hits.push(diabetes as AnyObj);
  if (check(ckd)) hits.push(ckd as AnyObj);
  if (check(high_bp)) hits.push(high_bp as AnyObj);
  return hits;
}

function applySafety(matchedKeys: string[]) {
  const out = { forbid: [] as string[], notes: [] as string[], targets: {} as AnyObj };
  const allRules: AnyObj[] = Array.isArray((safety as AnyObj).rules)
    ? (safety as AnyObj).rules
    : [];

  for (const r of allRules) {
    const when = r?.when?.conditions;
    if (!when) continue;

    const wantsAll = asStringArray(when).every((w) => {
      if (w === "*") return true;
      if (String(w).startsWith("!")) {
        const neg = String(w).slice(1);
        return !matchedKeys.includes(neg);
      }
      return matchedKeys.includes(String(w));
    });

    if (!wantsAll) continue;

    if (Array.isArray(r.forbid)) out.forbid.push(...r.forbid.map(String));
    if (Array.isArray(r.caution)) out.notes.push(`Caution: ${r.caution.join(", ")}`);
    if (r.targets && typeof r.targets === "object") Object.assign(out.targets, r.targets);
    if (typeof r.notes === "string") out.notes.push(r.notes);
  }
  out.forbid = uniq(out.forbid);
  out.notes = uniq(out.notes);
  return out;
}

export function buildPlan(profile: AnyObj): AnyObj {
  const conditions: string[] = asStringArray(profile?.conditions || []);
  const matched = pickMatches(conditions);

  // Aggregate avoids / prefers / targets / flags / notes
  let avoid: string[] = [];
  let prefer: string[] = [];
  const targets: AnyObj = {};
  const flags: AnyObj = {};
  let notes: string[] = [];

  for (const r of matched) {
    if (Array.isArray(r.avoid)) avoid.push(...r.avoid.map(String));
    if (Array.isArray(r.prefer)) prefer.push(...r.prefer.map(String));
    if (r.targets && typeof r.targets === "object") Object.assign(targets, r.targets);
    if (r.flags && typeof r.flags === "object") Object.assign(flags, r.flags);
    if (Array.isArray(r.notes)) notes.push(...r.notes.map(String));
  }

  // Apply global safety overlays
  const safetyOverlay = applySafety(
    matched.map((m) => String(m.condition)).filter(Boolean)
  );
  avoid = uniq([...avoid, ...safetyOverlay.forbid]);
  notes = uniq([...notes, ...safetyOverlay.notes]);
  Object.assign(targets, safetyOverlay.targets);

  // === PDF-friendly fields ===
  // Many exporters read createdAt at the root (not inside meta)
  const createdAt = new Date().toISOString();

  // Add times so lines like "08:00 — Breakfast" render instead of "undefined — Breakfast"
  const schedule = [
    {
      id: "breakfast",
      time: "08:00",
      title: "Breakfast",
      items: ["Protein + low-GI carb (measured)", "Fruit/veg serving if allowed"],
      guidance:
        flags.low_gi
          ? "Prefer low-GI choices; pair carbs with protein/fat."
          : "Balanced plate with whole foods.",
    },
    {
      id: "lunch",
      time: "13:00",
      title: "Lunch",
      items: ["Whole grain (measured)", "Dal/legume or lean protein", "Veg sabzi"],
      guidance: flags.even_meal_distribution
        ? "Distribute carbs evenly across meals."
        : "Keep sodium measured; avoid packaged foods.",
    },
    {
      id: "dinner",
      time: "19:30",
      title: "Dinner",
      items: ["Light whole grain or millet (measured)", "Protein", "Veg sabzi/salad"],
      guidance: "Avoid very late or heavy meals.",
    },
  ];

  return {
    // root fields some exporters rely on:
    createdAt,
    schedule,

    // structured details:
    meta: {
      engine: "stub-v1",
      createdAt,
      conditionsDetected: matched.map((m) => m.condition),
    },
    targets,
    flags,
    avoid,
    prefer: uniq(prefer),
    notes,
    // optional profile echo (helps some templates show “Profile”)
    profile: {
      age: profile?.age ?? undefined,
      height_cm: profile?.height_cm ?? undefined,
      weight_kg: profile?.weight_kg ?? undefined,
      conditions: conditions,
    },
  };
}

// Alt names to satisfy different callers
export const generate = buildPlan;
export default buildPlan;
