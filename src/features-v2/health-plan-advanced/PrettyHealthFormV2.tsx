// File: src/features-v2/health-plan-advanced/PrettyHealthFormV2.tsx
import React, { useEffect, useMemo, useState } from "react";

type Any = any;

const steps = [
  { key: "profile",   title: "Profile",      desc: "Your basic details & locale" },
  { key: "lifestyle", title: "Lifestyle",    desc: "Diet, culture, preferences" },
  { key: "schedule",  title: "Schedule",     desc: "Wake, sleep & work blocks" },
  { key: "medical",   title: "Health Info",  desc: "Conditions, symptoms (optional)" },
  { key: "uploads",   title: "Uploads",      desc: "Reports/notes (optional)" },
  { key: "review",    title: "Review",       desc: "Confirm, label & generate" }
];

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg border border-gray-100">{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-700">{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={"mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 " + (props.className || "")}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={"mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 " + (props.className || "")}
    />
  );
}

export default function PrettyHealthFormV2({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: Any) => void;
  initialData?: Any;
}) {
  const defaults = useMemo(
    () => ({
      profile: { localization: { language: "en" } },
      nutrition: {},
      schedule: {},
      medical: {},
      uploads: { files: [] as any[] },
      meals: {},
      meta: { title: "", tags: [] as string[] }, // 🔑 custom label + tags
    }),
    []
  );

  const [data, setData] = useState<any>(() => ({
    ...defaults,
    ...(initialData || {}),
    profile: {
      ...(defaults.profile || {}),
      ...(initialData?.profile || {}),
      account: { ...(initialData?.profile?.account || {}) },
      demographics: { ...(initialData?.profile?.demographics || {}) },
      localization: { language: initialData?.profile?.localization?.language || "en" },
    },
    nutrition: { ...(defaults.nutrition || {}), ...(initialData?.nutrition || {}) },
    schedule:  { ...(defaults.schedule  || {}), ...(initialData?.schedule  || {}) },
    medical:   { ...(defaults.medical   || {}), ...(initialData?.medical   || {}) },
    uploads:   { files: initialData?.uploads?.files || [] },
    meals:     { ...(defaults.meals     || {}), ...(initialData?.meals     || {}) },
    meta:      {
      title: initialData?.meta?.title || "",
      tags: Array.isArray(initialData?.meta?.tags) ? initialData.meta.tags : [],
    },
  }));

  useEffect(() => {
    if (initialData) {
      setData((prev: any) => ({
        ...prev,
        ...initialData,
        uploads: { files: initialData.uploads?.files || prev.uploads?.files || [] },
        meta: {
          title: initialData.meta?.title || prev.meta?.title || "",
          tags: Array.isArray(initialData.meta?.tags) ? initialData.meta.tags : (prev.meta?.tags || []),
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const [step, setStep] = useState(0);
  const pct = Math.round((step / (steps.length - 1)) * 100);
  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const submit = () => onSubmit(data);

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-900">Wellness Intake (V2)</h1>
          <p className="text-gray-600 mt-1">Neutral, non-clinical. Helps tailor general wellness suggestions.</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
            <div className="h-2 bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {steps[step].title} • {steps[step].desc}
          </div>
        </header>

        <Card>
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  placeholder="Your name"
                  value={data.profile?.account?.fullName || ""}
                  onChange={(e) =>
                    setData((d: any) => ({
                      ...d,
                      profile: { ...(d.profile || {}), account: { ...(d.profile?.account || {}), fullName: e.target.value } },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Language</Label>
                <Select
                  value={data.profile?.localization?.language || "en"}
                  onChange={(e) =>
                    setData((d: any) => ({
                      ...d,
                      profile: { ...(d.profile || {}), localization: { ...(d.profile?.localization || {}), language: e.target.value } },
                    }))
                  }
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                </Select>
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  placeholder="India"
                  value={data.profile?.demographics?.country || ""}
                  onChange={(e) =>
                    setData((d: any) => ({
                      ...d,
                      profile: { ...(d.profile || {}), demographics: { ...(d.profile?.demographics || {}), country: e.target.value } },
                    }))
                  }
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  placeholder="Ahmedabad"
                  value={data.profile?.demographics?.city || ""}
                  onChange={(e) =>
                    setData((d: any) => ({
                      ...d,
                      profile: { ...(d.profile || {}), demographics: { ...(d.profile?.demographics || {}), city: e.target.value } },
                    }))
                  }
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Diet Type</Label>
                <Select
                  value={data.nutrition?.dietType || ""}
                  onChange={(e) => setData((d:any)=>({ ...d, nutrition:{ ...(d.nutrition||{}), dietType: e.target.value }}))}
                >
                  <option value="">Select</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="non_vegetarian">Non-vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="mixed">Mixed</option>
                </Select>
              </div>
              <div>
                <Label>Allergies (comma separated)</Label>
                <Input
                  placeholder="peanut, milk"
                  value={(data.nutrition?.allergies || []).join(", ")}
                  onChange={(e)=>setData((d:any)=>({ ...d, nutrition:{ ...(d.nutrition||{}), allergies: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) }}))}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Preferences (likes)</Label>
                <Input
                  placeholder="idli, dal, salad"
                  value={(data.nutrition?.preferences || []).join(", ")}
                  onChange={(e)=>setData((d:any)=>({ ...d, nutrition:{ ...(d.nutrition||{}), preferences: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) }}))}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Wake Time (HH:MM)</Label>
                <Input
                  placeholder="06:30"
                  value={data.schedule?.wakeTime || ""}
                  onChange={(e)=>setData((d:any)=>({ ...d, schedule:{ ...(d.schedule||{}), wakeTime: e.target.value }}))}
                />
              </div>
              <div>
                <Label>Sleep Time (HH:MM)</Label>
                <Input
                  placeholder="22:30"
                  value={data.schedule?.sleepTime || ""}
                  onChange={(e)=>setData((d:any)=>({ ...d, schedule:{ ...(d.schedule||{}), sleepTime: e.target.value }}))}
                />
              </div>
              <div>
                <Label>Meals per day (3–6)</Label>
                <Input
                  type="number" min={3} max={6}
                  value={String(data.meals?.mealsPerDay ?? "")}
                  onChange={(e)=>setData((d:any)=>({ ...d, meals:{ ...(d.meals||{}), mealsPerDay: +e.target.value }}))}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <div>
                <Label>Known problems (optional)</Label>
                <Input
                  placeholder="e.g., trouble sleeping"
                  value={(data.medical?.conditions || []).join(", ")}
                  onChange={(e)=>setData((d:any)=>({ ...d, medical:{ ...(d.medical||{}), conditions: e.target.value? e.target.value.split(",").map(s=>s.trim()):[] }}))}
                />
              </div>
              <div>
                <Label>Current symptoms (optional)</Label>
                <Input
                  placeholder="e.g., tiredness, stiffness"
                  value={(data.medical?.symptoms || []).join(", ")}
                  onChange={(e)=>setData((d:any)=>({ ...d, medical:{ ...(d.medical||{}), symptoms: e.target.value? e.target.value.split(",").map(s=>s.trim()):[] }}))}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Upload health docs (optional). We store only safe metadata (name, size, type), not the files.
              </p>
              <Input
                type="file" multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).map(f => ({
                    name: f.name, size: f.size, type: f.type, lastModified: f.lastModified
                  }));
                  setData((d:any)=>({ ...d, uploads: { files } }));
                }}
              />
              {Boolean(data.uploads?.files?.length) && (
                <ul className="text-sm list-disc pl-6">
                  {data.uploads.files.map((f:any, i:number)=>(
                    <li key={i}>{f.name} ({Math.round(f.size/1024)} KB)</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {/* 🔑 Custom label + tags */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Plan Label / Title (optional)</Label>
                  <Input
                    placeholder="Morning Kidney Routine, Travel Day Plan…"
                    value={data.meta?.title || ""}
                    onChange={(e)=>setData((d:any)=>({ ...d, meta:{ ...(d.meta||{}), title: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label>Tags (comma separated, optional)</Label>
                  <Input
                    placeholder="morning, kidney, travel"
                    value={(data.meta?.tags || []).join(", ")}
                    onChange={(e)=>setData((d:any)=>({ ...d, meta:{ ...(d.meta||{}), tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } }))}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Review your entries. By submitting you agree to receive <b>non-clinical</b> general wellness suggestions.
              </p>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto max-h-64">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={prev} disabled={step===0}>Back</button>
          {step < steps.length - 1 ? (
            <button className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow" onClick={next}>Next</button>
          ) : (
            <button className="px-5 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 shadow" onClick={() => onSubmit(data)}>Submit</button>
          )}
        </div>
      </div>
    </div>
  );
}
