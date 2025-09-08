/* mho/plan/schema.ts */
export type Plan = {
  meta: {
    generatedAtISO: string;
    locale: "en"|"hi";
    version: "v1";
    disclaimerId: "standard";
    disclaimerText?: string;
  };
  day: {
    wake: string;
    sleep: string;
    hydration: { schedule: string[]; notes: string[] };
    meals: Array<{ label:"Breakfast"|"Mid-morning"|"Lunch"|"Evening"|"Dinner"; ideas:string[]; avoid:string[]; portion_hint?:string }>;
    movement: { blocks: string[]; notes: string[] };
    mind: { practices: string[] };
  };
  educationNotes: string[];
  redFlags?: string[];
  shareables: { whatsappText: string };
};