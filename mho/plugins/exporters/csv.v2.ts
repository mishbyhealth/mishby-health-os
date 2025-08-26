/* mho2/plugins/exporters/csv.v2.ts */
import { ComplianceGuard2 } from "../../compliance/ComplianceGuard2";
export async function exportPlanCSVv2(plan:any){
  const safe = ComplianceGuard2.filter(plan);
  const rows = [["Disclaimer", safe?.meta?.disclaimerText||""]];
  const csv = rows.map(r=>r.map(x=>JSON.stringify(x??"")).join(",")).join("\n");
  return new Blob([csv],{type:"text/csv"});
}