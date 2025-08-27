import React, { useRef, useState } from "react";
import { exportPlanPDF } from "../utils/pdfExporter"; // helper import

/** 
 * HealthPlan page
 * - Shows sample PlanViewV2 style cards
 * - Download PDF button (text-based export with fallback)
 */
export default function HealthPlan() {
  const planRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!planRef.current) return;
    setExporting(true);
    try {
      await exportPlanPDF(planRef.current, "text"); // use text-based export
    } catch (err) {
      console.error("PDF export error:", err);
      alert("PDF export में दिक्कत आई — कृपया पुनः प्रयास करें।");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Build Plan</h2>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow disabled:opacity-60"
        >
          {exporting ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>

      {/* stable wrapper for PlanView */}
      <div
        id="plan-root"
        ref={planRef}
        className="grid gap-4 print:bg-white"
        style={{ background: "transparent" }}
      >
        <PlanCard title="Morning Routine">
          <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
            <li>Wake at 6:30 AM, light stretching (5–7 min)</li>
            <li>Hydration: 300–400 ml warm water</li>
            <li>Calm breathing: 2–3 min (box breathing)</li>
          </ul>
        </PlanCard>

        <PlanCard title="Meals & Hydration">
          <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
            <li>Breakfast (8–9 AM): simple, fiber-rich</li>
            <li>Lunch (12:30–1:30 PM): balanced plate</li>
            <li>Water target: 8–10 glasses spread across day</li>
          </ul>
        </PlanCard>

        <PlanCard title="Movement">
          <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
            <li>Walk: 20–30 min (anytime comfortable)</li>
            <li>Breaks: every 60–90 min, 2–3 min mobility</li>
          </ul>
        </PlanCard>

        <PlanCard title="Evening Wind-Down">
          <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
            <li>Screen lights lower after sunset</li>
            <li>Light dinner; 2–3 hr gap before sleep</li>
            <li>Gratitude journaling: 2–3 lines</li>
          </ul>
        </PlanCard>
      </div>

      {/* Print styles for clean PDF */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer, aside { display: none !important; }
          main { padding: 0 !important; }
          #plan-root { background: #ffffff !important; }
        }
      `}</style>
    </section>
  );
}

/** Reusable card component (PlanViewV2 style) */
function PlanCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
