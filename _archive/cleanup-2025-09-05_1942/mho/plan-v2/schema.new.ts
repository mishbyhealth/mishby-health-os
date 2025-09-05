/* mho2/plan-v2/schema.ts */
export type PlanV2 = {
  meta: {
    generatedAtISO: string;
    locale: "en"|"hi";
    version:"v2";
    disclaimerId:"standard_v2";
    disclaimerText?:string;
  };
  day: {
    wake: string;
    sleep: string;
    hydration: { schedule: string[]; notes: string[]; };
    meals: Array<{ label:string; ideas:string[]; avoid:string[]; tags?:string[] }>;
    movement: { blocks: string[]; notes: string[]; };
    mind: { practices: string[] };
  };
  rationale: string[];
  variants?: any[];
  shareables?: { whatsappText?: string };
};