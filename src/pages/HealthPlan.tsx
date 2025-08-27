import React, { useRef, useState } from "react";
import { exportPlanPDF, exportPlanPDFPureText } from "../utils/pdfExporter";

/** HealthPlan page with two exports:
 *  - Download PDF (Styled)  -> image-perfect (no clipping)
 *  - Download PDF (Pure Text) -> selectable text
 */
export default function HealthPlan() {
  const planRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState<null | "styled" | "text">(null);

  const doStyled = async () => {
    if (!planRef.current) return;
    setBusy("styled");
    try { await exportPlanPDF(planRef.current); }
    catch (e) { console.error(e); alert("PDF export में दिक्कत आई."); }
    finally { setBusy(null); }
  };

  const doText = async () => {
    if (!planRef.current) return;
    setBusy("text");
    try { await exportPlanPDFPureText(planRef.current); }
    catch (e) { console.error(e); alert("Text PDF export में दिक्कत आई."); }
    finally { setBusy(null); }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Build Plan</h2>
        <div className="flex gap-2">
          <button
            onClick={doStyled}
            disabled={!!busy}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow disabled:opacity-60"
          >
            {busy === "styled" ? "Preparing…" : "Download PDF (Styled)"}
          </button>
          <button
            onClick={doText}
            disabled={!!busy}
            className="px-4 py-2 rounded-xl bg-white border border-black/10 shadow disabled:opacity-60"
          >
            {busy === "text" ? "Preparing…" : "Download PDF (Pure Text)"}
          </button>
        </div>
      </div>

      {/* Content wrapper */}
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

      {/* Print + PDF-export styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer, aside { display: none !important; }
          main { padding: 0 !important; }
          #plan-root { background: #ffffff !important; }
        }

        /* PDF export mode: यह class हम exporter में लगाते/हटाते हैं */
        .pdf-export {
          font-size: 11px;
          line-height: 1.35;
        }
        .pdf-export h2 { font-size: 15px; margin-bottom: 8px; }
        .pdf-export h3 { font-size: 13px; margin-bottom: 6px; }
        .pdf-export #plan-root { gap: 10px !important; }
        .pdf-export .plan-card {
          padding: 12px !important;
          border-radius: 12px !important;
          box-shadow: none !important;
          border: 1px solid rgba(0,0,0,0.14) !important;
          break-inside: avoid; page-break-inside: avoid;
          max-width: 100% !important;
        }

        /* General cards */
        .plan-card { width: 100%; }
      `}</style>
    </section>
  );
}

function PlanCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="plan-card p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
