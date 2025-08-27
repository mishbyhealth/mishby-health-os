import React, { useRef, useState } from "react";
import { exportPlanPDF, exportPlanPDFPureText } from "../utils/pdfExporter";
// (optional) अगर आपने पहले बनाया है:
// import { downloadPlanTxt } from "../utils/downloadTxt";

export default function HealthPlan() {
  const planRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState<null | "styled" | "text">(null);

  const handleStyledPDF = async () => {
    if (!planRef.current) return;
    setExporting("styled");
    try {
      await exportPlanPDF(planRef.current, "text"); // uses html() if available
    } catch (e) {
      console.error(e);
      alert("Styled PDF export में दिक्कत आई — कृपया पुनः प्रयास करें।");
    } finally {
      setExporting(null);
    }
  };

  const handlePureTextPDF = async () => {
    if (!planRef.current) return;
    setExporting("text");
    try {
      await exportPlanPDFPureText(planRef.current); // always extractable
    } catch (e) {
      console.error(e);
      alert("Text-only PDF export में दिक्कत आई — कृपया पुनः प्रयास करें।");
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Build Plan</h2>
        <div className="flex gap-2">
          <button
            onClick={handleStyledPDF}
            disabled={!!exporting}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow disabled:opacity-60"
          >
            {exporting === "styled" ? "Preparing…" : "Download PDF (Styled)"}
          </button>
          <button
            onClick={handlePureTextPDF}
            disabled={!!exporting}
            className="px-4 py-2 rounded-xl bg-white border border-black/10 shadow disabled:opacity-60"
          >
            {exporting === "text" ? "Preparing…" : "Download PDF (Pure Text)"}
          </button>
          {/*
          <button onClick={() => planRef.current && downloadPlanTxt(planRef.current)}
                  className="px-4 py-2 rounded-xl bg-white border border-black/10 shadow">
            Download .txt
          </button>
          */}
        </div>
      </div>

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

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer, aside { display: none !important; }
          main { padding: 0 !important; }
          #plan-root { background: #ffffff !important; }
        }
        #plan-root > * { page-break-inside: avoid; }
      `}</style>
    </section>
  );
}

function PlanCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
import React, { useRef, useState } from "react";
import { exportPlanPDF, exportPlanPDFPureText } from "../utils/pdfExporter";

/** HealthPlan page with Styled + Pure-Text PDF */
export default function HealthPlan() {
  const planRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState<null | "styled" | "text">(null);

  const handleStyledPDF = async () => {
    if (!planRef.current) return;
    setExporting("styled");
    try {
      await exportPlanPDF(planRef.current, "text");
    } catch (e) {
      console.error(e);
      alert("Styled PDF export में दिक्कत आई — कृपया पुनः प्रयास करें।");
    } finally {
      setExporting(null);
    }
  };

  const handlePureTextPDF = async () => {
    if (!planRef.current) return;
    setExporting("text");
    try {
      await exportPlanPDFPureText(planRef.current);
    } catch (e) {
      console.error(e);
      alert("Text-only PDF export में दिक्कत आई — कृपया पुनः प्रयास करें।");
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Build Plan</h2>
        <div className="flex gap-2">
          <button
            onClick={handleStyledPDF}
            disabled={!!exporting}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow disabled:opacity-60"
          >
            {exporting === "styled" ? "Preparing…" : "Download PDF (Styled)"}
          </button>
          <button
            onClick={handlePureTextPDF}
            disabled={!!exporting}
            className="px-4 py-2 rounded-xl bg-white border border-black/10 shadow disabled:opacity-60"
          >
            {exporting === "text" ? "Preparing…" : "Download PDF (Pure Text)"}
          </button>
        </div>
      </div>

      {/* stable wrapper */}
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

      {/* Print + PDF-Export styles */}
      <style>{`
        /* Browser print dialog के लिए */
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer, aside { display: none !important; }
          main { padding: 0 !important; }
          #plan-root { background: #ffffff !important; }
        }

        /* ✅ PDF-Export मोड: fonts/padding छोटे ताकि overflow न हो */
        .pdf-export {
          font-size: 12px;
          line-height: 1.35;
        }
        .pdf-export h2 { font-size: 16px; margin-bottom: 8px; }
        .pdf-export h3 { font-size: 14px; margin-bottom: 6px; }
        .pdf-export li { font-size: 11px; margin-bottom: 4px; }
        .pdf-export #plan-root { gap: 10px !important; }
        .pdf-export .plan-card {
          padding: 12px !important;
          border-radius: 12px !important;
          box-shadow: none !important;              /* bleed रोकने के लिए */
          border: 1px solid rgba(0,0,0,0.12) !important;
          break-inside: avoid; page-break-inside: avoid;
        }
        .pdf-export ul { margin-left: 14px; }
      `}</style>
    </section>
  );
}

/** card with class for PDF-specific padding */
function PlanCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="plan-card p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
