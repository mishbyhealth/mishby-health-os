/* mho2/engine-v2/modes.ts */
import type { IntakeV2 } from "./types";

export type ModeFlags = {
  lowGlycemic?:boolean;
  lowSodium?:boolean;
  lowPotassium?:boolean;
  minor?:boolean;
  pregnancy?:boolean;
};

export function computeModes(i: IntakeV2): ModeFlags {
  const m: ModeFlags = {};
  const age = i?.profile?.demographics?.age;
  if (typeof age==="number" && age<18) m.minor = true;
  if (i?.repro?.pregnant) m.pregnancy = true;
  if ((i?.medical?.conditions||[]).some(c=>/sugar|glyc/i.test(c))) m.lowGlycemic = true;
  if ((i?.medical?.conditions||[]).some(c=>/bp|pressure|salt/i.test(c))) m.lowSodium = true;
  if ((i?.medical?.conditions||[]).some(c=>/kidney|renal|potassium/i.test(c))) m.lowPotassium = true;
  return m;
}