// src/pages/PlanView.tsx — original clean look (solid emerald headers)
import React from "react";

type PlanData = {
  meta?: { title?: string };
  hydration?: { tips?: string[]; notes?: string[]; target?: string };
  movement?: { routines?: string[]; notes?: string[] };
  meals?: Array<{ label: string; ideas?: string[]; avoid?: string[] }>;
  mind?: { practices?: string[] };
};

export default function PlanView({ data }: { data: PlanData }) {
  const hydration = data?.hydration || {};
  const movement = data?.movement || {};
  const meals = data?.meals || [];

  return (
    <div className="space-y-6">
      {/* Hydration + Movement cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Hydration">
          <List bullets={hydration.tips} />
          {hydration.target ? (
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-medium">Target:</span> {hydration.target}
            </p>
          ) : null}
          {hydration.notes?.length ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</p>
              <List bullets={hydration.notes} size="sm" className="mt-1" />
            </div>
          ) : null}
        </Card>

        <Card title="Movement">
          <List bullets={movement.routines} />
          {movement.notes?.length ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</p>
              <List bullets={movement.notes} size="sm" className="mt-1" />
            </div>
          ) : null}
        </Card>
      </div>

      {/* Meals table */}
      <div>
        <Table title="Meals">
          <thead>
            <tr className="bg-emerald-600/90">
              <Th className="w-[20%] text-white text-center">Meal</Th>
              <Th className="w-[50%] text-white text-center">Ideas</Th>
              <Th className="w-[30%] text-white text-center">Avoid</Th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {(meals.length ? meals : fallbackMeals).map((row, idx) => (
              <tr
                key={idx}
                className={(idx % 2 === 0 ? "bg-gray-50 " : "bg-white ") + "align-top"}
              >
                <Td className="text-center font-medium">{row.label || "-"}</Td>
                <Td><Wrap text={row.ideas?.join(", ") || "-"} /></Td>
                <Td><Wrap text={row.avoid?.join(", ") || "-"} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <p className="mt-3 text-xs text-gray-500">
          This page provides non-clinical, general wellness guidance only.
        </p>
      </div>
    </div>
  );
}

/* ---------- simple UI primitives (original look) ---------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-emerald-600 text-white px-4 py-2 font-semibold">{title}</div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function List({
  bullets, size = "base", className = "",
}: { bullets?: string[]; size?: "base" | "sm"; className?: string }) {
  if (!bullets || bullets.length === 0) return <p className="text-gray-600 text-sm">—</p>;
  const textSize = size === "sm" ? "text-sm" : "text-base";
  return (
    <ul className={`space-y-2 ${textSize} ${className}`}>
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[6px] h-[6px] w-[6px] rounded-full bg-emerald-500" />
          <span className="leading-relaxed">{b}</span>
        </li>
      ))}
    </ul>
  );
}

function Table({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-emerald-600 text-white px-4 py-2 font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate [border-spacing:0]">
          {children}
        </table>
      </div>
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-3 text-sm font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 border-b border-gray-200 ${className}`}>{children}</td>;
}
function Wrap({ text }: { text: string }) {
  return <span className="whitespace-pre-wrap break-words leading-relaxed">{text || "-"}</span>;
}

/* ---------- fallback meals ---------- */
const fallbackMeals: Required<Required<PlanData>["meals"]> = [
  { label: "Breakfast", ideas: ["Whole grains, protein, fruit"], avoid: ["Heavy fried"] },
  { label: "Lunch", ideas: ["Dal/beans, veg, brown rice/roti"], avoid: ["Sugary drinks"] },
  { label: "Evening", ideas: ["Fruit or nuts (small)"], avoid: ["Packaged snacks"] },
  { label: "Dinner (light)", ideas: ["Veg + protein"], avoid: ["Very late meals"] },
];
