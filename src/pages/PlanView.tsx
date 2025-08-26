import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PDFExportButton from "@/features/exporters/PDFExportButton";

type Plan = {
  hydration?: string[];
  movement?: string[];
  meals?: string[];
};

type SectionProps = {
  name: string;
  items?: string[];
  variant?: "teal" | "lavender";
};

function Section({ name, items, variant = "teal" }: SectionProps) {
  if (!items || items.length === 0) return null;

  const tone =
    variant === "teal"
      ? {
          headerBg: "bg-teal-50",
          headerText: "text-teal-800",
          headerRing: "ring-teal-100",
          bullet: "marker:text-teal-500",
        }
      : {
          headerBg: "bg-violet-50",
          headerText: "text-violet-800",
          headerRing: "ring-violet-100",
          bullet: "marker:text-violet-500",
        };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-4 md:p-5">
      <div
        className={[
          "inline-flex items-center gap-2 rounded-xl px-3 py-1.5",
          tone.headerBg,
          tone.headerText,
          "ring-1",
          tone.headerRing,
          "mb-3",
        ].join(" ")}
        aria-label={`${name} section`}
      >
        <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
        <h3 className="text-base font-semibold leading-none">{name}</h3>
      </div>

      <ul
        className={[
          "list-disc pl-5 space-y-2 text-sm text-gray-700",
          "leading-relaxed",
          tone.bullet,
        ].join(" ")}
      >
        {items.map((it, i) => (
          <li key={`${name}-${i}`} className="whitespace-pre-line">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PlanView() {
  const [plan, setPlan] = useState<Plan>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("generatedPlan");
      if (raw) setPlan(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const isEmpty = useMemo(() => {
    const has =
      (plan.hydration && plan.hydration.length > 0) ||
      (plan.movement && plan.movement.length > 0) ||
      (plan.meals && plan.meals.length > 0);
    return !has;
  }, [plan]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8">
      {/* Top bar (keep button outside plan-root so it doesn't print in PDF) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Your Personalized Plan
        </h1>
        <PDFExportButton targetId="plan-root" filename="GloWell_Plan.pdf" />
      </div>

      {/* Printable region */}
      <div
        id="plan-root"
        className="rounded-2xl bg-white/70 p-4 md:p-6 ring-1 ring-gray-200 shadow-sm"
      >
        {/* Header inside printable area (text-only; logo intentionally omitted for stability) */}
        <div className="mb-5 border-b border-gray-200 pb-4">
          <p className="text-sm text-gray-500">
            This plan is a non-clinical wellness guide generated from your inputs.
          </p>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <p className="mb-3 text-gray-700">
              अभी कोई प्लान सेव नहीं मिला। पहले अपना हेल्थ प्लान बनाएं।
            </p>
            <Link
              to="/health-plan"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              Build Plan
            </Link>
          </div>
        )}

        {/* Sections grid */}
        {!isEmpty && (
          <div className="grid grid-cols-1 gap-4 md:gap-5">
            <Section
              name="Hydration"
              items={plan.hydration}
              variant="teal"
            />
            <Section
              name="Movement"
              items={plan.movement}
              variant="lavender"
            />
            <Section
              name="Meals"
              items={plan.meals}
              variant="teal"
            />
          </div>
        )}

        {/* Footer note (prints nicely) */}
        <div className="mt-6 text-xs text-gray-500">
          Note: This is not medical advice. For any clinical conditions, please
          consult a qualified professional.
        </div>
      </div>
    </div>
  );
}
