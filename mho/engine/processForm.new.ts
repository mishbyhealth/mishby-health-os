/* mho/engine/processForm.ts
 * Build a NON-CLINICAL plan from normalized data + neutral tags.
 */
import type { Plan } from "../plan/schema";
import { normalize } from "./normalize";

export async function buildPlan(formData: any): Promise<Plan> {
  const f = normalize(formData);
  const now = new Date().toISOString();

  const plan: Plan = {
    meta: { generatedAtISO: now, locale: f?.locale || "en", version: "v1", disclaimerId: "standard" },
    day: {
      wake: f?.schedule?.wake || "06:30",
      sleep: f?.schedule?.sleep || "22:30",
      hydration: {
        schedule: ["07:00","10:00","13:00","16:00","19:00"],
        notes: ["Sip regularly through the day."]
      },
      meals: [
        { label: "Breakfast",    ideas: ["Light, home-cooked options"], avoid: ["Very oily, very salty"] },
        { label: "Mid-morning",  ideas: ["Fruit or nuts"],              avoid: ["Heavy fried snacks"] },
        { label: "Lunch",        ideas: ["Balanced plate, vegetables"], avoid: ["Overly spicy, very salty"] },
        { label: "Evening",      ideas: ["Light snack if hungry"],      avoid: ["Deep-fried"] },
        { label: "Dinner",       ideas: ["Earlier, lighter dinner"],    avoid: ["Very late, heavy meals"] }
      ],
      movement: { blocks: ["Short relaxed walk (10–20 min)"], notes: ["Listen to your body."] },
      mind:     { practices: ["2–5 min calm breathing", "Gratitude note"] }
    },
    educationNotes: [
      "Prefer home-cooked, lightly seasoned meals.",
      "Keep a consistent sleep-wake schedule."
    ],
    shareables: { whatsappText: "Daily wellness plan: hydration sips, light meals, gentle walk, early sleep. (Non-clinical guidance)" }
  };

  // You can branch on neutral tags (culture, climate, problems/symptoms) here.

  return plan;
}