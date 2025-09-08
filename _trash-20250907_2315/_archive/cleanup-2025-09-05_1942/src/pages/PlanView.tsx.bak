// src/pages/PlanView.tsx
import React from "react";

export default function PlanView({ plan }: { plan: any }) {
  const d = plan?.day || {};

  return (
    <div className="gw-container space-y-6">
      <h2 className="text-2xl font-bold">Your Daily Wellness Plan</h2>
      <p className="text-sm gw-muted">
        {plan?.meta?.disclaimerText || "Non-clinical general wellness suggestions."}
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card p-4 space-y-2">
          <h3 className="text-lg font-semibold">Hydration</h3>
          <ul className="list-disc pl-5 space-y-1">
            {(d.hydration?.schedule || []).map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <p className="text-sm gw-muted">{(d.hydration?.notes || []).join(" • ")}</p>
        </section>

        <section className="card p-4 space-y-2">
          <h3 className="text-lg font-semibold">Movement</h3>
          <ul className="list-disc pl-5 space-y-1">
            {(d.movement?.blocks || []).map((b: string, i: number) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <p className="text-sm gw-muted">{(d.movement?.notes || []).join(" • ")}</p>
        </section>

        <section className="card p-4 space-y-2 md:col-span-2">
          <h3 className="text-lg font-semibold">Meals</h3>
          <ul className="list-disc pl-5 space-y-2">
            {(d.meals || []).map((m: any, i: number) => (
              <li key={i}>
                <b>{m.label}:</b> {(m.ideas || []).join(", ")}{" "}
                <i className="gw-muted">(avoid: {(m.avoid || []).join(", ")})</i>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
