// File: mho2/engine-v2/safeGenerate.ts
import type { PlanV2 } from "../plan-v2/schema";

export function generateSafePlanV2(input: any): { plan: PlanV2 | null; issues: { path: string; message: string }[] } {
  const now = new Date().toISOString();
  if (!input?.schedule?.wakeTime || !input?.schedule?.sleepTime) {
    return { plan: null, issues: [{ path: "schedule", message: "Wake & Sleep required" }] };
  }

  const plan: PlanV2 = {
    meta: { generatedAtISO: now, locale: "en", version: "v2", disclaimerId: "standard_v2" },
    day: {
      wake: input.schedule.wakeTime,
      sleep: input.schedule.sleepTime,
      hydration: { schedule: ["07:00", "10:00", "13:00", "16:00", "19:00"], notes: ["Sip regularly."] },
      meals: [
        { label: "Breakfast", ideas: ["Light, home-style options"], avoid: ["Very oily"] },
        { label: "Lunch", ideas: ["Balanced plate, seasonal veg"], avoid: ["Too salty"] },
        { label: "Dinner", ideas: ["Early & light dinner"], avoid: ["Very late meals"] },
      ],
      movement: { blocks: ["Easy walk (10–20 min)"], notes: ["Comfortable pace."] },
      mind: { practices: ["2–5 min calm breathing", "Gratitude note"] },
    },
    rationale: ["Neutral plan generated (demo)."],
  };

  return { plan, issues: [] };
}
