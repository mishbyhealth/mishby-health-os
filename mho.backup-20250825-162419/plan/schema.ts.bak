/* mho/plan/schema.ts */

export type Plan = {
  meta: {
    generatedAtISO: string;
    locale: "en" | "hi";
    version: "v1";
    disclaimerId: "standard";
    disclaimerText?: string;
  };

  // --- Existing basic day block (kept for backward compatibility)
  day: {
    wake: string;
    sleep: string;
    hydration: { schedule: string[]; notes: string[] };
    meals: Array<{
      label: "Breakfast" | "Mid-morning" | "Lunch" | "Evening" | "Dinner";
      ideas: string[];
      avoid: string[];
      portion_hint?: string;
    }>;
    movement: { blocks: string[]; notes: string[] };
    mind: { practices: string[] };
  };

  // --- New richer sections to match your desired plan style (non-clinical)
  strategy: {
    goal: string;                  // High-level aim (neutral phrasing)
    carefullyIncluded: string[];   // Bullet list of what’s intentionally included
    timingNotes: string[];         // Timing/structure rules
  };

  dayDetail: {
    title: string;                 // e.g., "Full Week Plan – Day 1 Example"
    morning: Array<{ time: string; item: string }>;
    waterIntake: Array<{ time: string; qty: string; note?: string }>;
    lunch: {
      components: Array<{ label: string; options: string[] }>;
      afterMealNotes: string[];
    };
    evening: Array<{ time: string; item: string }>;
    supper: Array<{ item: string }>;
    dinner: string[];
    night: Array<{ time: string; item: string }>;
  };

  rotation7d: Array<{
    day: number;
    veg1: string;
    veg2: string;
    soupOrDal: string;
    roti: string;
    extra: string;
  }>;

  fruitsSmallPortion: Array<{ fruit: string; quantity: string; when: string }>;

  avoidList: string[];           // Keep neutral language (no medical claims)
  yogaAndStretching: Array<{ time: string; duration: string; activity: string }>;

  educationNotes: string[];
  redFlags?: string[];
  shareables: { whatsappText: string };
};
