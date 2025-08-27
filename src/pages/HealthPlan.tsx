import React from "react";
import { exportPlanPDFClassic } from "../utils/pdfExporter";

// Same content as your preferred “Classic” PDF
const SECTIONS = [
  {
    title: "Hydration",
    items: [
      "Morning: 300 ml warm water",
      "Before lunch: 300 ml",
      "Evening: 300 ml",
      "Total target: 2400 ml (adjust by climate/activity)",
    ],
  },
  {
    title: "Movement",
    items: [
      "Daily steps target: 8000",
      "Every 60–90 min: 3–5 min light stretch/walk",
      "Add 15–25 min brisk walk",
    ],
  },
  {
    title: "Meals",
    items: [
      "Breakfast: whole grains + protein + fruit",
      "Lunch: dal/beans + veg + grain (brown rice/roti)",
      "Evening: fruit or nuts (small portion)",
      "Dinner (light): veg + protein; avoid heavy fried/late meals",
    ],
  },
] as const;

export default function HealthPlan() {
  const handleDownload = async () => {
    try {
      // Generate Classic, text-based PDF (no clipping)
      await exportPlanPDFClassic(SECTIONS.map(s => ({ title: s.title, items: [...s.items] })));
    } catch (e) {
      console.error(e);
      alert("PDF export में दिक्कत आई — कृपया पुनः प्रयास करें।");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Build Plan</h2>
        <button
          onClick={handleDownload}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow"
        >
          Download PDF
        </button>
      </div>

      {/* Screen view (cards) — PDF text layout अलग से बनता है */}
      <div className="grid gap-4">
        {SECTIONS.map((sec) => (
          <div
            key={sec.title}
            className="p-4 rounded-2xl shadow bg-white/90 border border-black/5"
          >
            <h3 className="font-medium mb-2">{sec.title}</h3>
            <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
              {sec.items.map((it, idx) => (
                <li key={idx}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
