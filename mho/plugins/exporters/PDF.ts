import type { Plan } from "@/components/plan/PlanCard";

// Step 1 stub: provide a no-deps export that still "works".
// For now, we download a .txt (printable) summary. Step 2 will switch to real PDF.
export async function exportPlanToPDF(plan: Plan): Promise<void> {
  const lines = [
    "Mishby Health OS — Personalized Plan",
    "===================================",
    `Name: ${plan.name}`,
    `Age: ${plan.age}`,
    `Goal: ${plan.goal}`,
    "",
    "Recommendations:",
    ...plan.recommendations.map((r, i) => `${i + 1}. ${r}`),
    "",
    plan.notes ? `Notes: ${plan.notes}` : "",
    ""
  ].join("\n");

  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plan.txt"; // Placeholder until real PDF in Step 2
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
