/* mho2/engine-v2/buildPlan.ts */
import type { IntakeV2 } from "./types";
import type { PlanV2 } from "../plan-v2/schema";

export function buildNeutralPlanV2(i: IntakeV2): PlanV2 {
  const now = new Date().toISOString();
  const wake = i?.schedule?.wakeTime || "06:30";
  const sleep= i?.schedule?.sleepTime || "22:30";
  return {
    meta: { generatedAtISO: now, locale: (i?.profile?.localization?.language==="hi"?"hi":"en"), version:"v2", disclaimerId:"standard_v2" },
    day: {
      wake, sleep,
      hydration: { schedule: ["07:00","10:00","13:00","16:00","19:00"], notes: ["Sip regularly across the day."] },
      meals: [
        { label:"Breakfast", ideas:["Light, home-style options"], avoid:["Very oily"], tags:["light"] },
        { label:"Mid-morning", ideas:["Whole fruit / handful nuts"], avoid:["Deep-fried"], tags:["snack"] },
        { label:"Lunch", ideas:["Balanced plate, seasonal veg"], avoid:["Overly salty"], tags:["main"] },
        { label:"Evening", ideas:["Simple snack if hungry"], avoid:["Heavy fried"], tags:["snack"] },
        { label:"Dinner", ideas:["Earlier & lighter dinner"], avoid:["Very late meals"], tags:["main"] }
      ],
      movement: { blocks:["Easy walk (10–20 min)"], notes:["Move at a comfortable pace."] },
      mind: { practices:["2–5 min calm breathing","Gratitude note"] }
    },
    rationale: ["Neutral day structure with hydration, balanced meals, gentle movement."]
  };
}