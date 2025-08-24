/* mho/plugins/exporters/pdf.ts */
import { ComplianceGuard } from "../../compliance/ComplianceGuard";
export async function exportPlanPDF(plan:any){
  const safe = ComplianceGuard.filterPlan(plan);
  // Replace with real pdf-lib; keeping a JSON blob for now:
  return new Blob([JSON.stringify(safe,null,2)],{type:"application/pdf"});
}