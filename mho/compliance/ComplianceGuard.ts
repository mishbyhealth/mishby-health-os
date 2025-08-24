/* mho/compliance/ComplianceGuard.ts
 * Filters out clinical terms from plan outputs and injects disclaimers.
 * Use this on EVERY user-facing plan/report.
 */
export type PlanLike = Record<string, any>;
type Rule = { pattern: string; flags?: string; replace?: string };
type Rules = { blockedTerms: Rule[]; requiredDisclaimers: { id: string; text: string }[] };
import rulesJson from "./nonClinical.rules.json" assert { type: "json" };
import { STRINGS } from "./strings";
const RULES = rulesJson as Rules;

function redactString(s: string): string {
  return (RULES.blockedTerms || []).reduce((acc, r) => {
    const re = new RegExp(r.pattern, r.flags || "gi");
    return acc.replace(re, r.replace ?? "[redacted]");
  }, s);
}
function redactDeep(v: any): any {
  if (typeof v === "string") return redactString(v);
  if (Array.isArray(v)) return v.map(redactDeep);
  if (v && typeof v === "object") {
    const o: any = {};
    for (const k of Object.keys(v)) o[k] = redactDeep(v[k]);
    return o;
  }
  return v;
}
export const ComplianceGuard = {
  filterPlan<T extends PlanLike>(plan: T): T {
    const filtered: any = redactDeep(plan);
    filtered.meta = filtered.meta || {};
    filtered.meta.disclaimerId = filtered.meta.disclaimerId || "standard";
    filtered.meta.disclaimerText = filtered.meta.disclaimerText || STRINGS.disclaimer.en;
    return filtered as T;
  },
  filterText(text: string) { return redactString(text); },
  disclaimer() { return STRINGS.disclaimer.en; }
};
