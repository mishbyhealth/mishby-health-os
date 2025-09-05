/* mho2/plugins/exporters/pdf.v2.ts */
import { ComplianceGuard2 } from "../../compliance/ComplianceGuard2";
export async function exportPlanPDFv2(plan:any){
  const safe = ComplianceGuard2.filter(plan);
  // Placeholder: integrate real PDF lib later
  return new Blob([JSON.stringify(safe,null,2)], { type:"application/pdf" });
}