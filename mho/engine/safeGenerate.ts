// mho/engine/safeGenerate.ts
// Non-clinical, general wellness planner (safe output)

export type SafePlan = {
  title: string;
  notes: string;
  hydration: string[];
  movement: string[];
  meals: string[];
};

type FormInput = any; // keep loose for now

export function generateSafePlan(form: FormInput): SafePlan {
  const name =
    form?.profile?.account?.fullName?.trim?.() ||
    "Your Daily Wellness Plan";
  const goal =
    (form?.profile?.account?.goal as string) || "General Wellness";
  const age = Number(form?.profile?.account?.age) || undefined;
  const lang = (form?.profile?.account?.language as string) || "English";

  // --- base sections ---
  const hydration: string[] = [
    "Start the day with 1 glass of warm water",
    "Sip water regularly; avoid chugging",
    "Target ~8–10 cups/day; adjust for climate & activity",
  ];

  const movement: string[] = [
    "Walk 25–35 minutes at easy pace",
    "5–10 minutes of gentle stretches",
    "2–3 short mobility breaks across the day",
  ];

  const meals: string[] = [
    "Breakfast: simple, unprocessed foods; include fruit or sprouts",
    "Lunch: half-plate veggies + balanced grains/pulses",
    "Dinner: lighter than lunch; finish 2–3 hours before sleep",
  ];

  // --- light personalization (non-clinical, safe) ---
  if (age && age >= 55) {
    movement.push("Prefer low-impact moves; avoid overexertion");
    hydration.push("Distribute intake evenly through the day");
  }

  switch (goal) {
    case "Weight Balance":
      movement.push("Add 10–12 min brisk segment to your walk");
      meals.push("Mind portions; prefer home-cooked, minimally processed");
      break;
    case "Energy & Stamina":
      movement.push("Include 2–3 short posture/breath resets");
      meals.push("Add nuts/seeds (small handful) in the day");
      break;
    case "Calm & Sleep":
      movement.push("Evening: 5 min slow breathing or light stroll");
      meals.push("Avoid heavy dinners and late caffeine");
      break;
    default:
      // General Wellness: keep base lists
      break;
  }

  // --- optional friendly language tweak ---
  if (lang === "Hindi") {
    hydration[0] = "दिन की शुरुआत 1 गिलास गरम पानी से करें";
  } else if (lang === "Gujarati") {
    hydration[0] = "દિવસની શરૂઆત 1 ગ્લાસ ગરમ પાણીથી કરો";
  }

  return {
    title: typeof name === "string" ? name : "Your Daily Wellness Plan",
    notes:
      "Non-wellness general wellness suggestions. Adjust gently to your routine.",
    hydration,
    movement,
    meals,
  };
}
