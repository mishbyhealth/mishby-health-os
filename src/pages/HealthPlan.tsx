import React, { useRef, useState } from "react";
import { exportPlanPDF, exportPlanPDFPureText } from "../utils/pdfExporter";

/**
 * HealthPlan page
 * - Smart wrapping: लंबी लाइनों को अपने-आप छोटे टुकड़ों में तोड़ता है
 * - Styled PDF + Pure-Text PDF export
 * - CSS से overflow-wrap/word-break/hyphens चालू ताकि कटना/ओवरलैप न हो
 */

const MAX_LINE_LEN = 60; // ← चाहें तो 50-70 के बीच रख सकते हैं (छोटे वाक्य)

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

  // (Optional) WhatsApp/Plain text copy — छोटे टुकड़ों वाला टेक्स्ट
  const handleCopyAsText = async () => {
    if (!planRef.current) return;
    const data = collectPlanText(MAX_LINE_LEN);
    await navigator.clipboard.writeText(data);
    alert("Plan text copied (short lines) — आप WhatsApp में paste कर सकते हैं.");
  };

  return (
    <section className="space-y-4">
      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Build Plan</h2>
        <div className="flex flex-wrap gap-2">
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
          <button
            onClick={handleCopyAsText}
            className="px-4 py-2 rounded-xl bg-white border border-black/10 shadow"
          >
            Copy (short lines)
          </button>
        </div>
      </div>

      {/* Stable wrapper */}
      <div
        id="plan-root"
        ref={planRef}
        className="grid gap-4 print:bg-white"
        style={{ background: "transparent" }}
      >
        <PlanCard title="Morning Routine" items={[
          "Wake at 6:30 AM, light stretching (5–7 min)",
          "Hydration: 300–400 ml warm water",
          "Calm breathing: 2–3 min (box breathing)"
        ]} />

        <PlanCard title="Meals & Hydration" items={[
          "Breakfast (8–9 AM): simple, fiber-rich",
          "Lunch (12:30–1:30 PM): balanced plate",
          "Water target: 8–10 glasses spread across day"
        ]} />

        <PlanCard title="Movement" items={[
          "Walk: 20–30 min (anytime comfortable)",
          "Breaks: every 60–90 min, 2–3 min mobility"
        ]} />

        <PlanCard title="Evening Wind-Down" items={[
          "Screen lights lower after sunset",
          "Light dinner; 2–3 hr gap before sleep",
          "Gratitude journaling: 2–3 lines"
        ]} />
      </div>

      {/* Print + PDF-Export + Wrap Styles */}
      <style>{`
        /* Print */
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer, aside { display: none !important; }
          main { padding: 0 !important; }
          #plan-root { background: #ffffff !important; }
        }

        /* ✅ PDF-Export मोड: fonts/padding छोटे (pdfExporter.ts इस class को जोड़ता/हटाता है) */
        .pdf-export {
          font-size: 11px;
          line-height: 1.35;
        }
        .pdf-export h2 { font-size: 15px; margin-bottom: 8px; }
        .pdf-export h3 { font-size: 13px; margin-bottom: 6px; }

        /* सबसे महत्वपूर्ण: right-cut/overlap रोकने के लिए wrapping */
        .plan-card, .plan-card * {
          overflow-wrap: anywhere;   /* long words भी टूट सकें */
          word-break: break-word;    /* जरूरत पर शब्द भी टूटें */
          hyphens: auto;             /* ब्राउज़र/पीडीएफ hyphen लगाए */
        }

        /* PDF में कॉम्पैक्ट कार्ड */
        .pdf-export #plan-root { gap: 10px !important; }
        .pdf-export .plan-card {
          padding: 12px !important;
          border-radius: 12px !important;
          box-shadow: none !important;
          border: 1px solid rgba(0,0,0,0.14) !important;
          break-inside: avoid; page-break-inside: avoid;
          max-width: 100% !important;
        }

        /* स्क्रीन पर कार्ड फुल-चौड़ाई (border auto जैसा अनुभव) */
        .plan-card { width: 100%; }
        .plan-card ul { margin-left: 1.1rem; }
        .plan-card li { margin-bottom: 0.25rem; }
      `}</style>
    </section>
  );
}

/** कार्ड: items को स्मार्ट तरीके से छोटे-छोटे टुकड़ों में तोड़कर bullets बनाता है */
function PlanCard({ title, items }: { title: string; items: string[] }) {
  // items → wrappedLines (हर लंबी लाइन कई छोटी लाइनों में टूटे)
  const wrapped = items.flatMap((t) => wrapByChars(t, MAX_LINE_LEN).map(s => s.trim()));

  return (
    <div className="plan-card p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      <ul className="list-disc text-sm text-slate-700 space-y-1">
        {wrapped.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

/** लंबा वाक्य LIMIT के अंदर छोटे-छोटे हिस्सों में बांटता है (स्पेस/विरामचिह्न पर प्राथमिकता) */
function wrapByChars(text: string, limit: number): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return [cleaned];

  const out: string[] = [];
  let current = "";

  const tokens = cleaned.split(" ");
  for (const token of tokens) {
    const next = current ? current + " " + token : token;
    if (next.length <= limit) {
      current = next;
    } else {
      if (current) out.push(current);
      // token अपने आप में बहुत लंबा है (जैसे कोई बड़ा शब्द) → hard split
      if (token.length > limit) {
        const chunks = token.match(new RegExp(`.{1,${limit}}`, "g")) || [token];
        out.push(...chunks.slice(0, -1));
        current = chunks[chunks.length - 1];
      } else {
        current = token;
      }
    }
  }
  if (current) out.push(current);

  // विरामचिह्न के बाद वाली सीमा को smooth करें
  return out.map(s => s.replace(/\s*([,;:])\s*/g, "$1 ").replace(/\s+/g, " ").trim());
}

/** Plain text तैयार करता है (WhatsApp आदि के लिए) */
function collectPlanText(limit: number): string {
  const sections: { title: string; items: string[] }[] = [
    {
      title: "Morning Routine",
      items: [
        "Wake at 6:30 AM, light stretching (5–7 min)",
        "Hydration: 300–400 ml warm water",
        "Calm breathing: 2–3 min (box breathing)"
      ]
    },
    {
      title: "Meals & Hydration",
      items: [
        "Breakfast (8–9 AM): simple, fiber-rich",
        "Lunch (12:30–1:30 PM): balanced plate",
        "Water target: 8–10 glasses spread across day"
      ]
    },
    {
      title: "Movement",
      items: [
        "Walk: 20–30 min (anytime comfortable)",
        "Breaks: every 60–90 min, 2–3 min mobility"
      ]
    },
    {
      title: "Evening Wind-Down",
      items: [
        "Screen lights lower after sunset",
        "Light dinner; 2–3 hr gap before sleep",
        "Gratitude journaling: 2–3 lines"
      ]
    }
  ];

  const lines: string[] = [];
  for (const s of sections) {
    lines.push(`\n${s.title}`);
    const wrapped = s.items.flatMap(t => wrapByChars(t, limit));
    for (const w of wrapped) lines.push(`• ${w}`);
  }
  return lines.join("\n").trim();
}
