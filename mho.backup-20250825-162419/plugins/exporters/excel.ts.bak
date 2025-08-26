/* mho/plugins/exporters/excel.ts (stub) */
import { ComplianceGuard } from "../../compliance/ComplianceGuard";
export async function exportPlanExcel(plan:any){
  const safe = ComplianceGuard.filterPlan(plan);
  const csv = "Disclaimer," + JSON.stringify(safe.meta?.disclaimerText||"") + "\n";
  return new Blob([csv],{type:"text/csv"});
}