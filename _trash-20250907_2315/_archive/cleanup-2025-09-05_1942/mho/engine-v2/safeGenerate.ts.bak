/* mho2/engine-v2/safeGenerate.ts */
import { ComplianceGuard2 } from "../compliance/ComplianceGuard2";
import type { IntakeV2 } from "./types";
import { normalizeV2 } from "./normalize";
import { validateV2 } from "./validate";
import { buildNeutralPlanV2 } from "./buildPlan";
import type { PlanV2 } from "../plan-v2/schema";

export function generateSafePlanV2(input:any): { plan: PlanV2|null; issues: {path:string;message:string}[] } {
  const norm = normalizeV2(input);
  const issues = validateV2(norm);
  if (issues.length) return { plan: null, issues };
  const raw = buildNeutralPlanV2(norm);
  const safe = ComplianceGuard2.filter(raw);
  return { plan: safe, issues: [] };
}