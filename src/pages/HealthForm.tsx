import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * HealthForm (v7 tweak)
 * - Progress now starts at 0% (was 10%).
 * - The fields "Cooking Skills" and "Prep time per meal (min)" are REMOVED/hidden.
 * - On Submit: saves an intake payload to sessionStorage (and a copy to localStorage)
 *   keys:
 *     - "glowell:intake:current"
 *   Then navigates to /health-plan. (Plan generation stays as-is in your app.)
 */

type Intake = {
  meta: {
    createdAt: string; // ISO
    timezone: string;
    language?: string;
    region?: string;
    version: string; // "v7"
  };
  basics: {
    age?: number;
    gender?: "Male" | "Female" | "Other" | "";
  };
  body: {
    heightCm?: number;
    weightKg?: number;
  };
  preferences: {
    vegOnly?: boolean;
    spiceTolerance?: "Low" | "Medium" | "High" | "";
  };
};

const GENDER_OPTS = ["Male", "Female", "Other"] as const;
const SPICE_OPTS = ["Low", "Medium", "High"] as const;

export default function HealthForm() {
  const navigate = useNavigate();

  // ---- steps (keep simple; progress should show 0% on first step) ----
  const steps = useMemo(() => ["Basics", "Body", "Preferences"], []);
  const [step, setStep] = useState(0); // 0-indexed → 0% on first render

  // ---- form state (without Cooking Skills & Prep Time) ----
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<Intake["basics"]["gender"]>("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [vegOnly, setVegOnly] = useState(false);
  const [spiceTolerance, setSpiceTolerance] = useState<Intake["preferences"]["spiceTolerance"]>("");

  // ---- progress: exact 0% at step 0 ----
  const progressPct = Math.round((step / steps.length) * 100);

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // very light validation (basics & body)
  function canNextFromBasics() {
    return age !== "" && Number(age) >= 0 && gender && gender !== "";
  }
  function canNextFromBody() {
    return heightCm !== "" && Number(heightCm) > 0 && weightKg !== "" && Number(weightKg) > 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    const intake: Intake = {
      meta: {
        createdAt: new Date().toISOString(),
        timezone: tz,
        language: navigator.language,
        region: "",
        version: "v7",
      },
      basics: {
        age: age === "" ? undefined : Number(age),
        gender: (gender ?? "") as Intake["basics"]["gender"],
      },
      body: {
        heightCm: heightCm === "" ? undefined : Number(heightCm),
        weightKg: weightKg === "" ? undefined : Number(weightKg),
      },
      preferences: {
        vegOnly,
        spiceTolerance: (spiceTolerance ?? "") as Intake["preferences"]["spiceTolerance"],
      },
    };

    try {
      // primary location used by HealthPlan getters I provided
      sessionStorage.setItem("glowell:intake:current", JSON.stringify(intake));
      // also keep a copy in localStorage (handy between tabs)
      localStorage.setItem("glowell:intake:current", JSON.stringify(intake));
    } catch {
      // ignore storage errors
    }

    // (We do NOT set "glowell:plan:current" here; HealthPlan can compute/handle fallback.)
    navigate("/health-plan");
  }

  // ---- UI ----
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Health Intake Form</h1>

      {/* Progress (starts at 0%) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm opacity-80">Progress</span>
          <span className="text-sm font-medium">{progressPct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded">
          <div
            className="h-2 rounded"
            style={{ width: `${progressPct}%`, backgroundColor: "black", opacity: 0.7 }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            role="progressbar"
          />
        </div>
        <div className="mt-2 text-sm opacity-80">
          Step {step + 1} of {steps.length} — {steps[step]}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basics */}
        {step === 0 && (
          <section className="border rounded p-4 space-y-4">
            <h2 className="font-semibold">Basics</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="block text-sm">
                Age
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  className="mt-1 w-full border rounded px-3 py-2"
                  required
                />
              </label>

              <label className="block text-sm">
                Gender
                <select
                  value={gender ?? ""}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="mt-1 w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select…</option>
                  {GENDER_OPTS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="border rounded px-3 py-1"
                onClick={next}
                disabled={!canNextFromBasics()}
                title={!canNextFromBasics() ? "Fill required fields" : ""}
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Body */}
        {step === 1 && (
          <section className="border rounded p-4 space-y-4">
            <h2 className="font-semibold">Body</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="block text-sm">
                Height (cm)
                <input
                  type="number"
                  min={50}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                  className="mt-1 w-full border rounded px-3 py-2"
                  required
                />
              </label>

              <label className="block text-sm">
                Weight (kg)
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                  className="mt-1 w-full border rounded px-3 py-2"
                  required
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button type="button" className="border rounded px-3 py-1" onClick={prev}>
                Back
              </button>
              <button
                type="button"
                className="border rounded px-3 py-1"
                onClick={next}
                disabled={!canNextFromBody()}
                title={!canNextFromBody() ? "Fill required fields" : ""}
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Preferences (kept minimal; Cooking Skills / Prep Time REMOVED) */}
        {step === 2 && (
          <section className="border rounded p-4 space-y-4">
            <h2 className="font-semibold">Preferences</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                />
                Veg-only
              </label>

              <label className="block text-sm">
                Spice tolerance
                <select
                  value={spiceTolerance ?? ""}
                  onChange={(e) => setSpiceTolerance(e.target.value as any)}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="">Select…</option>
                  {SPICE_OPTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              <button type="button" className="border rounded px-3 py-1" onClick={prev}>
                Back
              </button>
              <button type="submit" className="border rounded px-3 py-1">
                Submit
              </button>
            </div>
          </section>
        )}
      </form>
    </div>
  );
}
