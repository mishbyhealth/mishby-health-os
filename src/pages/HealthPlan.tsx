import React, { useRef, useState } from "react";

/**
 * HealthPlan page
 * - Renders PlanView-like cards inside #plan-root
 * - "Download PDF" exports the DOM to PDF using html2canvas + jsPDF
 * - If libs are missing, falls back to window.print()
 */

export default function HealthPlan() {
  const planRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    const el = planRef.current;
    if (!el) return;

    setExporting(true);
    try {
      // Try dynamic import (keeps bundle lean; works on Netlify)
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Scale for sharp PDF
      const scale = 2; // 2x for clarity (adjust if large)
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit image into A4 while preserving aspect
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      remainingHeight -= pageHeight;

      // Add extra pages if content taller than one page
      while (remainingHeight > -pageHeight) {
        position = remainingHeight - imgHeight; // shift image up
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        remainingHeight -= pageHeight;
      }

      // File name
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      pdf.save(`GloWell_HealthPlan_${stamp}.pdf`);
    } catch (err) {
      console.error("PDF export failed, falling back to print():", err);
      alert(
        "PDF exporter libraries नहीं मिलीं — अभी ब्राउज़र की print to PDF खोली जा रही है.\n\n" +
          "Permanent fix: package.json में जोड़ें →\n  npm i jspdf html2canvas"
      );
      // Safe fallback
      window.print();
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

      {/* v4 के अनुसार stable wrapper */}
      <div
        id="plan-root"
        ref={planRef}
        className="grid gap-4 print:bg-white"
        style={{ background: "transparent" }}
      >
        {/* ✨ Sample Plan Sections (PlanViewV2 style cards) */}
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

      {/* Print styles: so browser PDF भी साफ निकले */}
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

/** Small card helper (PlanViewV2 look) */
function PlanCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
