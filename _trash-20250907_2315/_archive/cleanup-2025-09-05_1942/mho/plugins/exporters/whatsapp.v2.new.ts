/* mho2/plugins/exporters/whatsapp.v2.ts */
import { ComplianceGuard2 } from "../../compliance/ComplianceGuard2";
export function buildWhatsAppTextV2(plan:any){
  const safe = ComplianceGuard2.filter(plan);
  return safe?.shareables?.whatsappText || "Neutral daily wellness outline (non-wellness).";
}