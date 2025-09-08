/* src/features/health-plan/MultiStepHealthForm.tsx
 * GloWell — Polished multi-step form with brand buttons/inputs
 * Steps: Basics → Lifestyle → Schedule → Problems/Symptoms → Uploads → Review
 */
import React, { useState } from "react";

type FormData = any;

const steps = [
  "Basics",
  "Lifestyle",
  "Schedule",
  "Problems & Symptoms",
  "Uploads",
  "Review",
];

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {steps.map((label, i) => {
        const active = i <= step;
        return (
          <div key={label} className="flex items-center">
            <div
              className={`h-8 px-3 flex items-center justify-center rounded-full text-xs font-medium
              ${active ? "bg-[var(--gw-teal)] text-white" : "bg-white text-[var(--gw-navy)] border"}
            `}
              title={label}
            >
              {i + 1}. {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-[2px] mx-2 ${active ? "bg-[var(--gw-teal)]" : "bg-[var(--gw-border)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const Card: React.FC<{ title: string; children: React.ReactNode; subtitle?: string }> = ({
  title,
  subtitle,
  children,
}) => (
  <section className="card p-5 space-y-4">
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm gw-muted mt-1">{subtitle}</p>}
    </div>
    {children}
  </section>
);

export default function MultiStepHealthForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    locale: "en",
    lifestyle: {},
    schedule: {},
    problems: [],
    symptoms: [],
    uploads: {},
  });

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const done = () => onSubmit(data);

  return (
    <div className="gw-container max-w-3xl space-y-5">
      <h2 className="text-2xl font-bold">GloWell Health Form (Non-Clinical)</h2>
      <Stepper step={step} />

      {step === 0 && (
        <Card title="Basics" subtitle="Tell us a little about you.">
          <label className="block space-y-1">
            <span className="text-sm">Name</span>
            <input
              className="input"
              placeholder="Enter your full name"
              onChange={(e) =>
                setData({ ...data, profile: { ...(data.profile || {}), name: e.target.value } })
              }
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm">Age</span>
              <input
                type="number"
                className="input"
                placeholder="e.g., 34"
                onChange={(e) =>
                  setData({ ...data, profile: { ...(data.profile || {}), age: +e.target.value } })
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm">Sex</span>
              <select
                className="input"
                onChange={(e) =>
                  setData({ ...data, profile: { ...(data.profile || {}), sex: e.target.value } })
                }
              >
                <option value="">Select</option>
                <option>male</option>
                <option>female</option>
                <option>other</option>
              </select>
            </label>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Lifestyle" subtitle="Dietary style and cultural preferences.">
          <label className="block space-y-1">
            <span className="text-sm">Diet Type</span>
            <select
              className="input"
              onChange={(e) =>
                setData({
                  ...data,
                  lifestyle: { ...(data.lifestyle || {}), dietType: e.target.value },
                })
              }
            >
              <option value="">Select</option>
              <option>vegan</option>
              <option>veg</option>
              <option>eggetarian</option>
              <option>pescatarian</option>
              <option>non-veg</option>
              <option>mixed</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm">Religion</span>
            <select
              className="input"
              onChange={(e) =>
                setData({
                  ...data,
                  lifestyle: { ...(data.lifestyle || {}), religion: e.target.value },
                })
              }
            >
              <option value="">None</option>
              <option>jain</option>
              <option>sattvic</option>
              <option>halal</option>
              <option>kosher</option>
            </select>
          </label>
        </Card>
      )}

      {step === 2 && (
        <Card title="Schedule" subtitle="Usual wake/sleep times.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm">Wake (HH:MM)</span>
              <input
                className="input"
                placeholder="06:30"
                onChange={(e) =>
                  setData({ ...data, schedule: { ...(data.schedule || {}), wake: e.target.value } })
                }
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm">Sleep (HH:MM)</span>
              <input
                className="input"
                placeholder="22:30"
                onChange={(e) =>
                  setData({
                    ...data,
                    schedule: { ...(data.schedule || {}), sleep: e.target.value },
                  })
                }
              />
            </label>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card
          title="Problems & Symptoms (Non-wellness)"
          subtitle="Free text is okay — we’ll only use this to shape neutral wellness suggestions."
        >
          <label className="block space-y-1">
            <span className="text-sm">Known problems (comma separated)</span>
            <input
              className="input"
              placeholder="e.g., high BP, high sugar"
              onChange={(e) =>
                setData({
                  ...data,
                  problems: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm">Current symptoms (comma separated)</span>
            <input
              className="input"
              placeholder="e.g., weakness, dizziness"
              onChange={(e) =>
                setData({
                  ...data,
                  symptoms: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </label>
        </Card>
      )}

      {step === 4 && (
        <Card
          title="Uploads"
          subtitle="Upload prescriptions/lab reports if you have them. We’ll use them only to adjust neutral wellness suggestions."
        >
          <input type="file" multiple className="block" />
          <p className="text-xs gw-muted">
            Note: This app does not provide medical advice. Uploads are optional.
          </p>
        </Card>
      )}

      {step === 5 && (
        <Card title="Review & Consent">
          <p className="text-sm gw-muted">
            By submitting, you agree this app shares general wellness suggestions only (non-clinical).
          </p>
          <pre className="bg-white border rounded p-3 text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </Card>
      )}

      {/* Footer buttons */}
      <div className="flex items-center justify-between">
        <button className="btn btn-ghost" onClick={prev} disabled={step === 0}>
          Back
        </button>

        {step < 5 ? (
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={() => setStep(0)}>
              Reset
            </button>
            <button className="btn btn-primary btn-lg" onClick={next}>
              Next
            </button>
          </div>
        ) : (
          <button className="btn btn-success btn-lg" onClick={done}>
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
