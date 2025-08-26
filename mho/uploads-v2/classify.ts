/* mho2/uploads-v2/classify.ts */
export type DocType="prescription"|"lab"|"discharge"|"other";
export function classifyV2(t:string):DocType{
  t=t.toLowerCase();
  if(t.includes("glucose")||t.includes("hemoglobin")) return "lab";
  if(t.includes("rx")||t.includes("sig")) return "prescription";
  if(t.includes("discharge")) return "discharge";
  return "other";
}