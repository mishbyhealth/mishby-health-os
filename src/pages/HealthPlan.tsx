import React, { useRef } from "react";
import { Helmet } from "react-helmet-async";

export default function HealthPlan() {
  const planRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    // Lightweight, reliable “print to PDF” fallback
    // (your earlier advanced exporter is great; this keeps a simple path too)
    window.print();
  };

  return (
    <section className="space-y-6">
      <Helmet>
        <title>Build Plan • GloWell</title>
        <meta
          name="description"
          content="Your personal wellness plan—hydration, movement and meals. Download a clean, shareable PDF."
        />
        <link rel="canonical" href="https://mishbyhealth.netlify.app/health-plan" />

        <meta property="og:site_name" content="GloWell" />
        <meta property="og:title" content="Your GloWell Plan" />
        <meta
          property="og:description"
          content="Hydration, movement and meals—simple steps you can stick with. Download as PDF."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mishbyhealth.netlify.app/health-plan" />
        <meta property="og:image" content="https://mishbyhealth.netlify.app/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your GloWell Plan" />
        <meta
          name="twitter:description"
          content="Hydration, movement and meals—simple steps you can stick with. Download as PDF."
        />
        <meta name="twitter:image" content="https://mishbyhealth.netlify.app/og.png" />
      </Helmet>

      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Build Plan</h2>
        <button
          onClick={downloadPdf}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow hover:opacity-90"
        >
          Download PDF
        </button>
      </header>

      <div ref={planRef} id="plan-root" className="space-y-4">
        <Section title="Hydration">
          <ul className="list-disc ml-5 text-slate-700 space-y-1">
            <li>Morning: 300 ml warm water</li>
            <li>Before lunch: 300 ml</li>
            <li>Evening: 300 ml</li>
            <li>Total target: 2400 ml (adjust by climate/activity)</li>
          </ul>
        </Section>

        <Section title="Movement">
          <ul className="list-disc ml-5 text-slate-700 space-y-1">
            <li>Daily steps target: 8000</li>
            <li>Every 60–90 min: 3–5 min light stretch/walk</li>
            <li>Add 15–25 min brisk walk</li>
          </ul>
        </Section>

        <Section title="Meals">
          <ul className="list-disc ml-5 text-slate-700 space-y-1">
            <li>Breakfast: whole grains + protein + fruit</li>
            <li>Lunch: dal/beans + veg + grain (brown rice/roti)</li>
            <li>Evening: fruit or nuts (small portion)</li>
            <li>Dinner (light): veg + protein; avoid heavy fried/late meals</li>
          </ul>
        </Section>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
