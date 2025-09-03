// File: src/pages/PlanViewV2.tsx
import React from "react";
import { savePlanPDF } from "@/../mho2/plugins/exporters/pdf";
import { shareOnWhatsApp, copyShareText } from "@/../mho2/plugins/exporters/whatsapp";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print:break-inside-avoid bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5 card">
      <h3 className="text-lg font-semibold text-emerald-900 mb-3 print:text-black">{title}</h3>
      {children}
    </section>
  );
}

export default function PlanViewV2({ plan }: { plan: any }) {
  const d = plan?.day || {};
  const title =
    plan?.meta?.userTitle?.trim?.() ||
    plan?.meta?.title?.trim?.() ||
    "Your Wellness Day";
  const generated = plan?.meta?.generatedAtISO
    ? new Date(plan.meta.generatedAtISO).toLocaleString()
    : "-";
  const tags: string[] = plan?.meta?.tags || [];

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8 print:bg-white print:px-0 print:py-0">
      <style>
        {`
        @page { margin: 16mm; }
        @media print {
          .no-print { display: none !important; }
          .print-container { max-width: 100% !important; padding: 0 !important; }
          .card { box-shadow: none !important; border-color: #e5e7eb !important; }
          body { background: #fff !important; }
          h1,h2,h3 { color: #000 !important; }
          .muted { color: #111 !important; }
          .grid { gap: 16px !important; }
        }
      `}
      </style>

      <div className="max-w-5xl mx-auto space-y-6 print-container">
        <header className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-emerald-900 print:text-black">
            {title}
          </h2>
          {tags?.length > 0 && (
            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 print:border-gray-300 print:bg-white"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 muted">Generated: {generated}</p>
          <p className="text-gray-600 mt-1 muted">
            {plan?.meta?.disclaimerText || "General wellness suggestions only (non-wellness)."}
          </p>

          <div className="no-print mt-4 flex items-center justify-center gap-3 flex-wrap">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              onClick={async () => { await savePlanPDF(plan, "WellnessPlanV2.pdf"); }}
            >
              Download PDF
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => shareOnWhatsApp(plan)}
            >
              Share on WhatsApp (Web)
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              onClick={() => copyShareText(plan)}
            >
              Copy Text
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Hydration">
            <ul className="space-y-2">
              {(d.hydration?.schedule || []).map((t: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 print:hidden" />
                  <span className="font-medium">{t}</span>
                </li>
              ))}
            </ul>
            {!!(d.hydration?.notes || []).length && (
              <p className="text-sm text-gray-600 mt-2 muted">{(d.hydration?.notes || []).join(" • ")}</p>
            )}
          </Section>

          <Section title="Movement">
            <ul className="list-disc pl-6">
              {(d.movement?.blocks || []).map((b: string, i: number) => <li key={i}>{b}</li>)}
            </ul>
            {!!(d.movement?.notes || []).length && (
              <p className="text-sm text-gray-600 mt-2 muted">{(d.movement?.notes || []).join(" • ")}</p>
            )}
          </Section>

          <Section title="Meals">
            <ul className="space-y-2">
              {(d.meals || []).map((m: any, i: number) => (
                <li key={i}>
                  <b>{m.label}:</b> {(m.ideas || []).join(", ")}{" "}
                  <i className="opacity-70 print:opacity-100">(avoid: {(m.avoid || []).join(", ")})</i>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
