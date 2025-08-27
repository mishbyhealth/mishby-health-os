// src/utils/downloadTxt.ts
export function downloadPlanTxt(planEl: HTMLElement) {
  const text = planEl.innerText || "";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "GloWell_HealthPlan.txt";
  a.click();
  URL.revokeObjectURL(url);
}
