/* mho2/uploads-v2/classify.ts */
export type DocType="recommendation [non-wellness]"|"lab"|"discharge"|"other";
export function classifyV2(t:string):DocType{
  t=t.toLowerCase();
  if(t.includes("glucose")||t.includes("hemoglobin")) return "lab";
  if(t.includes("[redacted]")||t.includes("sig")) return "recommendation [non-wellness]";
  if(t.includes("discharge")) return "discharge";
  return "other";
}