import type { ProcessedForm } from "mho/engine/processForm";
import type { Plan } from "@/components/plan/PlanCard";

/**
 * Normalize incoming goal labels from the form so variants like:
 * "Muscle Gain", "muscle_gain", "muscle-gain" all map to "muscle_gain".
 */
function normalizeGoal(input?: string): string {
  if (!input) return "general_wellness";

  // Lowercase and convert all non-letters to underscores
  const raw = input.trim().toLowerCase().replace(/[^a-z]+/g, "_");

  // Map common labels/aliases to our canonical keys
  const aliases: Record<string, string> = {
    general_wellness: "general_wellness",

    weight_loss: "weight_management",
    weight_management: "weight_management",

    muscle_gain: "muscle_gain",

    diabetes_control: "sugar_control",
    sugar_control: "sugar_control",
    blood_sugar: "sugar_control",

    heart_health: "heart_health",

    bp_control: "bp_control",
    blood_pressure: "bp_control",
  };

  return aliases[raw] || raw;
}

function titleCaseFromKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Basic planner with per-goal extras.
 * Returns a Plan expected by your PlanCard.
 */
export function buildPlan(data: ProcessedForm): Plan {
  const goalKey = normalizeGoal(data.goal);

  const base: string[] = [
    "Walk 20–30 mins daily in fresh air.",
    "Drink adequate water throughout the day.",
    "Prioritize fresh, minimally processed foods.",
  ];

  const goalExtras: Record<string, string[]> = {
    general_wellness: [
      "Maintain a consistent sleep schedule.",
      "Daily stretching or mobility for 10 mins.",
    ],

    weight_management: [
      "Add 15–20 mins brisk walking after meals.",
      "Prefer high-fiber meals (vegetables, lentils, whole grains).",
      "Avoid sugary drinks; choose water or unsweetened options.",
    ],

    // ✅ Muscle Gain
    muscle_gain: [
      "Strength training 3–4x/week (full-body or split).",
      "Prioritize protein-rich foods (lentils, eggs/dairy, lean meats, tofu).",
      "Target ~1.2–1.6 g protein/kg bodyweight daily (adjust with a professional).",
      "Sleep 7–8 hours nightly for recovery.",
      "Hydrate before and after workouts.",
    ],

    // Heart/BP support
    heart_health: [
      "Include aerobic activity 4–5x/week (30 mins moderate).",
      "Use healthy fats (nuts, seeds, olive oil) and reduce trans fats.",
      "Monitor sodium and ultra-processed foods.",
    ],
    bp_control: [
      "Limit added salt; favor potassium-rich veggies (spinach, beans, bananas).",
      "Practice slow breathing/relaxation twice daily.",
      "Choose low-sodium options and cook at home when possible.",
    ],

    // Blood sugar support
    sugar_control: [
      "Balanced meals with fiber, protein, and healthy fats.",
      "Avoid sugary drinks and refined sweets.",
      "Take a light 10–15 min walk after meals.",
    ],
  };

  const recommendations = [...base, ...(goalExtras[goalKey] ?? [])];

  return {
    name: data.name || "Friend",
    // Coerce to number safely if needed by Plan type
    age:
      typeof (data as any).age === "number"
        ? (data as any).age
        : Number((data as any).age) || 0,
    // Keep friendly label if provided, else derive from key
    goal: data.goal || titleCaseFromKey(goalKey),
    recommendations,
    notes:
      "This is a starter plan. A detailed, culturally aware plan will be generated in the next step.",
  };
}
