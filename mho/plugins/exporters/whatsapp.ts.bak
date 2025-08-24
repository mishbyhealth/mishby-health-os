/* mho/plugins/exporters/whatsapp.ts (stub) */
import { ComplianceGuard } from "../../compliance/ComplianceGuard";
export function buildWhatsAppText(plan:any){
  const safe = ComplianceGuard.filterPlan(plan);
  return safe?.shareables?.whatsappText || "Daily wellness suggestions (non-clinical).";
}