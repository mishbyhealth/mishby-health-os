import React from "react";

/** Brand palette (keep in sync with PDF exporter) */
const BRAND = {
  primary: "#1fb6ae",
  bg: "#f7f5ed",
  border: "#dcd7c9",
  subtle: "#52616b",
  zebra: "#fbfaf5",
  header: "#e9f7f6",
};

type Plan = any;

function useSections(plan: Plan) {
  const H = plan?.day?.hydration || {};
  const hydration: string[] = [];
  if (Array.isArray(H.schedule) && H.schedule.length) hydration.push(...H.schedule.map((t: string) => `• ${t}`));
  if (Array.isArray(H.notes) && H.notes.length) hydration.push(`Notes: ${H.notes.join(" • ")}`);
  if (H.target) hydration.push(`Target: ${H.target}`);
  if (!hydration.length) hydration.push("• As per your day’s routine");

  const MV = plan?.day?.movement || {};
  const movement: string[] = [];
  if (Array.isArray(MV.blocks) && MV.blocks.length) movement.push(...MV.blocks.map((b: string) => `• ${b}`));
  if (Array.isArray(MV.notes) && MV.notes.length) movement.push(`Notes: ${MV.notes.join(" • ")}`);
  if (!movement.length) movement.push("• Gentle stretches and a brisk walk");

  const meals = Array.isArray(plan?.day?.meals) ? plan.day.meals : [];
  const mealRows =
    meals.length
      ? meals.map((m: any) => ({
          label: m?.label ?? "",
          ideas: (m?.ideas ?? []).join(", "),
          avoid: (m?.avoid ?? []).join(", "),
        }))
      : [{ label: "Balanced Plate", ideas: "Veg + whole grains + protein", avoid: "" }];

  return { hydration, movement, mealRows };
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BRAND.border, background: "#fff" }}>
      <div className="px-4 py-3" style={{ background: BRAND.primary }}>
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <div className="p-4" style={{ background: BRAND.bg }}>
        <ul className="space-y-2 text-[15px] leading-6 text-gray-800">
          {items.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MealsTable({ rows }: { rows: Array<{ label: string; ideas: string; avoid: string }> }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: BRAND.border, background: "#fff" }}>
      <div className="px-4 py-3 text-sm font-semibold" style={{ background: BRAND.header, color: "#1f2937" }}>
        Meals
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left" style={{ background: BRAND.header }}>
              <th className="px-4 py-3 w-[20%]">Meal</th>
              <th className="px-4 py-3 w-[55%]">Ideas</th>
              <th className="px-4 py-3 w-[25%]">Avoid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} style={{ background: idx % 2 ? BRAND.zebra : "#fff" }}>
                <td className="px-4 py-3 align-top border-t" style={{ borderColor: BRAND.border }}>
                  {r.label}
                </td>
                <td className="px-4 py-3 align-top border-t" style={{ borderColor: BRAND.border }}>
                  {r.ideas}
                </td>
                <td className="px-4 py-3 align-top border-t" style={{ borderColor: BRAND.border }}>
                  {r.avoid}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlanView({ plan }: { plan: Plan }) {
  const { hydration, movement, mealRows } = useSections(plan);

  return (
    <div className="space-y-5">
      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Hydration" items={hydration} />
        <Card title="Movement" items={movement} />
      </div>

      {/* Meals table */}
      <MealsTable rows={mealRows} />

      {/* Friendly disclaimer (matches PDF language) */}
      <p className="text-xs text-gray-600">
        This page provides non-clinical, general wellness guidance only. For medical concerns, please consult a qualified professional.
      </p>
    </div>
  );
}
