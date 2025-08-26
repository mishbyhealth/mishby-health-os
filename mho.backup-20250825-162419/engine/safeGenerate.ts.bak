/* mho/engine/safeGenerate.ts */
import { ComplianceGuard } from "../compliance/ComplianceGuard";
import type { Plan } from "../plan/schema";
import { buildPlan } from "./processForm";

export async function generateSafePlan(formData: any): Promise<Plan> {
  const raw = await buildPlan(formData);
  return ComplianceGuard.filterPlan(raw as unknown as Plan);
}
