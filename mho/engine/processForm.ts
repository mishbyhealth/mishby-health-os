/* mho/engine/processForm.ts
 * Build a NON-CLINICAL plan from normalized data + neutral tags.
 */
import type { Plan } from "../plan/schema";
import { normalize } from "./normalize";

export async function buildPlan(formData: any): Promise<Plan> {
  const f = normalize(formData);
  const now = new Date().toISOString();

  const plan: Plan = {
    meta: {
      generatedAtISO: now,
      locale: f?.locale || "en",
      version: "v1",
      disclaimerId: "standard",
    },

    // Keep the simple day for compatibility
    day: {
      wake: f?.schedule?.wake || "06:30",
      sleep: f?.schedule?.sleep || "22:30",
      hydration: {
        schedule: ["07:00", "10:00", "13:00", "16:00", "19:00"],
        notes: ["Sip regularly through the day."],
      },
      meals: [
        { label: "Breakfast", ideas: ["Light, home-cooked options"], avoid: ["Very oily, very salty"] },
        { label: "Mid-morning", ideas: ["Fruit or nuts"], avoid: ["Heavy fried snacks"] },
        { label: "Lunch", ideas: ["Balanced plate, vegetables"], avoid: ["Overly spicy, very salty"] },
        { label: "Evening", ideas: ["Light snack if hungry"], avoid: ["Deep-fried"] },
        { label: "Dinner", ideas: ["Earlier, lighter dinner"], avoid: ["Very late, heavy meals"] },
      ],
      movement: { blocks: ["Short relaxed walk (10–20 min)"], notes: ["Listen to your body."] },
      mind: { practices: ["2–5 min calm breathing", "Gratitude note"] },
    },

    // --- New sections reflecting your requested structure (neutral wording)
    strategy: {
      goal:
        "Support gentle whole-body balance: steady energy, calm circulation, heart-friendly habits, and comfortable daily rhythm.",
      carefullyIncluded: [
        "Mild grains and pulses in appropriate portions",
        "Vegetables that are generally easy on the system",
        "Seasonal fruit in small portions",
        "Warm liquids to encourage a smooth daily flow and digestion",
        "Unhurried walking, calm breathing, light yoga",
      ],
      timingNotes: [
        "Keep consistent timings to avoid over-straining the body",
        "Prefer earlier dinner and a calm wind-down",
      ],
    },

    dayDetail: {
      title: "Full Week Plan — Day 1 Example (same structure for Days 2–7 with small variations)",
      morning: [
        { time: "06:30", item: "Wake up, light smile, positive thoughts 🙏" },
        { time: "06:45", item: "Warm water (~100 ml) + 3 tulsi leaves + 1 soaked raisin (peeled)" },
        { time: "07:00", item: "Gentle stretches (5 min): neck, shoulders, knees" },
        { time: "07:15", item: "Calm breathing (10 min): Anulom-Vilom + Brahmari" },
        { time: "07:30", item: "1 cup barley tea OR jeera-ajwain water (caffeine-free)" },
        { time: "08:00", item: "Unhurried walk (7–10 min) + 2–3 egg whites (boiled) + 1 phulka with bottle gourd or pumpkin" },
        { time: "09:00", item: "100 ml plain water (sip slowly)" },
      ],
      waterIntake: [
        { time: "06:45", qty: "100 ml", note: "herbal" },
        { time: "09:00", qty: "100 ml" },
        { time: "11:00", qty: "150 ml" },
        { time: "13:30", qty: "150 ml", note: "pre-lunch" },
        { time: "16:00", qty: "150 ml", note: "herbal" },
        { time: "18:30", qty: "150 ml" },
        { time: "20:30", qty: "150 ml" },
        { time: "22:00", qty: "100 ml", note: "sips" },
      ],
      lunch: {
        components: [
          { label: "Grain", options: ["Wheat roti (1)", "Barley roti (1)", "Sieved rice (2 tbsp)"] },
          { label: "Dal/Soup", options: ["Masoor dal (well-washed)", "Bottle gourd soup", "Moong soup"] },
          { label: "Veg (gentle)", options: ["Tinda", "Pumpkin", "Bottle gourd", "Parval", "Ridge gourd"] },
          { label: "Side", options: ["1 tsp cold-pressed sesame oil", "Fresh green chutney (no tomato)"] },
        ],
        afterMealNotes: ["Sit quietly in Vajrasana (5 min)", "Short slow walk indoors (50–70 steps)"],
      },
      evening: [
        { time: "16:00", item: "1 cup barley water / coriander water (lukewarm)" },
        { time: "16:30", item: "Recline and rest eyes for 10 min — no phone" },
        { time: "17:00", item: "Calm breathing + soft music or bhajan" },
        { time: "17:30", item: "Small relaxed walk (5–10 min)" },
      ],
      supper: [
        { item: "1 small phulka with steamed parval / bottle gourd / bitter gourd" },
        { item: "Optional: 1 egg white OR a small soft paneer cube (about 1 tbsp)" },
      ],
      dinner: [
        "1 cup lauki soup or moong dal water",
        "½ small khichdi (rice + moong) OR 1 barley roti",
        "Prefer no added salt later in the evening",
        "Sit in Vajrasana (3–5 min) after meal",
      ],
      night: [
        { time: "21:00", item: "Feet wash with warm water" },
        { time: "21:30", item: "Quiet reading or devotional audio" },
        { time: "22:00", item: "100 ml water (sips) + 1 clove if digestion feels heavy" },
        { time: "22:15", item: "Sleep on left side for gentle digestion" },
      ],
    },

    rotation7d: [
      { day: 1, veg1: "Bottle gourd", veg2: "Pumpkin", soupOrDal: "Moong", roti: "Barley", extra: "Tulsi water" },
      { day: 2, veg1: "Tinda", veg2: "Ridge gourd", soupOrDal: "Masoor", roti: "Wheat + Barley", extra: "Jeera water" },
      { day: 3, veg1: "Parval", veg2: "Yellow gourd", soupOrDal: "Lauki soup", roti: "Barley", extra: "Coriander water" },
      { day: 4, veg1: "Cabbage", veg2: "Pumpkin", soupOrDal: "Moong soup", roti: "Wheat", extra: "Ajwain water" },
      { day: 5, veg1: "Bottle gourd", veg2: "Ridge gourd", soupOrDal: "Masoor", roti: "Barley", extra: "Fennel (saunf) tea" },
      { day: 6, veg1: "Tinda", veg2: "Lauki", soupOrDal: "Moong", roti: "Wheat", extra: "Cardamom water" },
      { day: 7, veg1: "Parval", veg2: "Yellow gourd", soupOrDal: "Bottle gourd soup", roti: "Wheat + Barley", extra: "Basil decoction" },
    ],

    fruitsSmallPortion: [
      { fruit: "Apple", quantity: "½ fruit", when: "Morning or 11 AM" },
      { fruit: "Papaya", quantity: "3–4 small cubes", when: "Mid-morning" },
      { fruit: "Pear", quantity: "½", when: "Afternoon (not daily)" },
      { fruit: "Jamun (seasonal)", quantity: "4–5 pieces", when: "As available" },
    ],

    avoidList: [
      "Tomatoes, spinach, brinjal, beetroot (can be heavier for some people)",
      "Milk, curd (can feel heavy for some)",
      "Pickles, papad, bakery items",
      "Tea/coffee — keep minimal",
      "Very oily or long-stored foods",
    ],

    yogaAndStretching: [
      { time: "Morning", duration: "10 min", activity: "Anulom-Vilom + Brahmari (calm breathing)" },
      { time: "Post-meals", duration: "3–5 min", activity: "Vajrasana (easy sitting)" },
      { time: "Evening", duration: "5 min", activity: "Butterfly pose (light)" },
    ],

    educationNotes: [
      "Keep portions small and timings steady.",
      "Prefer gently cooked, lightly seasoned meals.",
      "Listen to your body; ease off if anything feels heavy.",
      "Total daily fluids around 1.2–1.5 L unless you’ve been guided otherwise.",
    ],

    shareables: {
      whatsappText:
        "Gentle weekly wellness plan: warm morning start, calm breathing, short walks, light veg rotations, small fruit portions, steady sips. (General wellness guidance)",
    },
  };

  return plan;
}
