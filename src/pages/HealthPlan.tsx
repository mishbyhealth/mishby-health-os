/* src/pages/HealthPlan.tsx
   Health Plan page with REAL PDF export and a polished, on-brand Download button
*/
import React from "react";
import PlanView from "./PlanView"; // same folder
import { exportPlanPDF } from "../../mho/plugins/exporters/pdf";

function loadPlan(): any {
  const fromWindow = (window as any).__PLAN__;
  if (fromWindow) return fromWindow;
  try {
    const raw = localStorage.getItem("glowell:plan");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    meta: { disclaimerText: "Non-clinical, general wellness guidance." },
    day: {
      hydration: {
        schedule: ["Morning: 300 ml warm water", "Before lunch: 300 ml", "Evening: 300 ml"],
        notes: ["Sip slowly", "Adjust by climate/activity"],
        target: "2400 ml",
      },
      movement: {
        blocks: ["8k steps target", "Every 60–90 min: 3–5 min stretch", "15–25 min brisk walk"],
        notes: ["Keep posture neutral"],
      },
      meals: [
        { label: "Breakfast", ideas: ["Whole grains", "Protein", "Fruit"], avoid: [] },
        { label: "Lunch", ideas: ["Dal/beans", "Veg", "Brown rice/Roti"], avoid: [] },
        { label: "Evening", ideas: ["Fruit or nuts (small)"], avoid: [] },
        { label: "Dinner (light)", ideas: ["Veg + protein"], avoid: ["Heavy fried", "Late meals"] },
      ],
    },
  };
}

export default function HealthPlan() {
  const plan = React.useMemo(() => loadPlan(), []);
  const [downloading, setDownloading] = React.useState(false);

  async function handleDownloadPDF() {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await exportPlanPDF(plan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `GloWell_Plan_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("PDF export नहीं हो पाया — Console में error देखें.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Health Plan</h1>

        {/* On-brand button: brand color #1fb6ae with subtle hover/disabled */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className={[
            "px-3 py-2 rounded-lg border transition",
            "border-[#1fb6ae]/30",
            downloading
              ? "bg-[#1fb6ae]/40 text-white cursor-not-allowed"
              : "bg-[#1fb6ae] text-white hover:bg-[#18a299]"
          ].join(" ")}
          title="Download as PDF"
        >
          {downloading ? "Downloading…" : "⬇️ Download PDF"}
        </button>
      </div>

      <PlanView plan={plan} />
    </div>
  );
}
