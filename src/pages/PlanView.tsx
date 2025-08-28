/* src/pages/PlanView.tsx
   Presentational-only view of the plan (no Download button here)
*/
import React from "react";

type PlanProps = { plan: any };

export default function PlanView({ plan }: PlanProps) {
  const d = plan?.day || {};

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Your Daily Wellness Plan</h2>
        <p className="text-sm opacity-70">
          {plan?.meta?.disclaimerText || "Non-clinical, general wellness guidance."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="p-3 border rounded">
          <h3 className="font-medium mb-2">Hydration</h3>
          <ul className="list-disc pl-5">
            {(d.hydration?.schedule || []).map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <div className="text-sm opacity-70">
            {(d.hydration?.notes || []).join(" • ")}
            {d.hydration?.target ? ` • Target: ${d.hydration.target}` : ""}
          </div>
        </section>

        <section className="p-3 border rounded">
          <h3 className="font-medium mb-2">Movement</h3>
          <ul className="list-disc pl-5">
            {(d.movement?.blocks || []).map((b: string, i: number) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <div className="text-sm opacity-70">{(d.movement?.notes || []).join(" • ")}</div>
        </section>

        <section className="p-3 border rounded md:col-span-2">
          <h3 className="font-medium mb-2">Meals</h3>
          <ul className="list-disc pl-5">
            {(d.meals || []).map((m: any, i: number) => (
              <li key={i}>
                <b>{m.label}:</b> {(m.ideas || []).join(", ")}{" "}
                {Array.isArray(m.avoid) && m.avoid.length ? (
                  <i className="opacity-70">(avoid: {m.avoid.join(", ")})</i>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
