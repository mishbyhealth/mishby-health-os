/* mho2/compliance/ComplianceGuard2.ts
 * Redacts clinical wording and injects non-clinical disclaimers (v2 namespace).
 */
export type AnyObj = Record<string, any>;
type Rule = { pattern: string; flags?: string; replace?: string };
type Rules = { blockedTerms: Rule[]; requiredDisclaimers: { id: string; text: string }[] };
import rulesJson from "./nonClinical.v2.rules.json" assert { type: "json" };
import { STRINGS2 } from "./strings2";
const RULES = rulesJson as Rules;

function redactString(s: string): string {
  return (RULES.blockedTerms||[]).reduce((acc, r) => {
    const re = new RegExp(r.pattern, r.flags || "gi");
    return acc.replace(re, r.replace ?? "[redacted]");
  }, s);
}
function redactDeep(v: any): any {
  if (typeof v === "string") return redactString(v);
  if (Array.isArray(v)) return v.map(redactDeep);
  if (v && typeof v === "object") {
    const out: AnyObj = {};
    for (const k of Object.keys(v)) out[k] = redactDeep(v[k]);
    return out;
  }
  return v;
}
export const ComplianceGuard2 = {
  filter<T extends AnyObj>(o: T): T {
    const f:any = redactDeep(o);
    f.meta = f.meta || {};
    f.meta.disclaimerId = f.meta.disclaimerId || "standard_v2";
    f.meta.disclaimerText = f.meta.disclaimerText || STRINGS2.disclaimer.en;
    return f as T;
  },
  disclaimer(){ return STRINGS2.disclaimer.en; }
};