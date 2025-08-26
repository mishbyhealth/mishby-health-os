// src/pages/HealthPlanFlow.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Profile = {
  name?: string;
  lifestyle?: "sedentary" | "light" | "moderate" | "active" | "athlete" | string;
  goal?: "wellness" | "fitness" | "weight-loss" | "muscle" | string;
};

type Plan = {
  hydration: string[];
  movement: string[];
  meals: string[];
};

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem("profile");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildFallbackPlan(profile: Profile): Plan {
  const ls = (profile.lifestyle || "moderate").toLowerCase();
  const goal = (profile.goal || "wellness").toLowerCase();

  const water = ls === "active" || ls === "athlete" ? "2800 ml" : ls === "moderate" ? "2400 ml" : "2000 ml";
  const steps = ls === "athlete" ? 12000 : ls === "active" ? 10000 : ls === "moderate" ? 8000 : 6000;

  const hydrate: string[] = [
    `Morning: 300 ml warm water`,
    `Before lunch: 300 ml`,
    `Evening: 300 ml`,
    `Total target: ${water} (adjust by climate/activity)`,
  ];

  const move: string[] = [
    `Daily steps target: ${steps}`,
    `Every 60–90 min: 3–5 min light stretch/walk`,
    goal === "muscle" ? "Add 20–30 min strength training (alt days)" : "Add 15–25 min brisk walk",
  ];

  const meals: string[] = [
    "Breakfast: whole grains + protein + fruit",
    "Lunch: dal/beans + veg + grain (brown rice/roti)",
    "Evening: fruit or nuts (small portion)",
    "Dinner (light): veg + protein; avoid heavy fried/late meals",
  ];

  return { hydration: hydrate, movement: move, meals };
}

export default function HealthPlanFlow() {
  const profile = useMemo(loadProfile, []);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saved, setSaved] = useState(false);

  const generatePlan = () => {
    // If you already have an engine, call it here and return the same shape.
    const p = buildFallbackPlan(profile);
    setPlan(p);
    try {
      localStorage.setItem("generatedPlan", JSON.stringify(p));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Build Plan</h1>
      <p className="text-sm text-gray-600 mb-6">
        Hello {profile.name || "Friend"} — choose “Generate Plan”. It will be saved and viewable on the Plan page.
      </p>

      <div className="card">
        <div className="flex items-center gap-3">
          <button
            onClick={generatePlan}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-teal-50 text-sm"
          >
            Generate Plan
          </button>

          {saved && (
            <Link
              to="/plan"
              className="px-4 py-2 rounded-xl border bg-white hover:bg-violet-50 text-sm"
            >
              Open Plan
            </Link>
          )}
        </div>

        {plan && (
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Preview: Hydration</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {plan.hydration.map((x, i) => <li key={`h-${i}`}>{x}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Preview: Movement</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {plan.movement.map((x, i) => <li key={`m-${i}`}>{x}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Preview: Meals</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {plan.meals.map((x, i) => <li key={`me-${i}`}>{x}</li>)}
              </ul>
            </div>

            <p className="text-xs text-gray-500">
              Saved to browser storage as <code>generatedPlan</code>. Open the Plan page to export a PDF.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
