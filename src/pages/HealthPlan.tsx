// src/pages/HealthPlan.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ensurePacksLoaded, type PacksResult } from "../utils/packs";
import { getAiPlanEnabled, requestAiPlan, type PlanJson } from "@/services/planService";

const PLANS_KEY = "glowell:plans";
const INDEX_KEY = "glowell:plans:index";
const INTAKE_KEY = "glowell:intake";
const SUB_KEY = "glowell:subscription";

type Gender = "male" | "female" | "other" | "";
type DietType = "vegetarian" | "vegan" | "eggetarian" | "non_vegetarian" | "all_eater";
type Spice = "low" | "medium" | "high";

type IntakeData = {
  age?: number | null;
  gender?: Gender;
  heightCm?: number | null;
  weightKg?: number | null;
  dietType?: DietType;
  spiceTolerance?: Spice;
  state?: string;
  city?: string;
  region?: string;
  timezone?: string;
  // legacy
  vegOnly?: boolean;
};

type Subscription = {
  name?: string;
  email?: string;
  mobile?: string;
  tier?: "free" | "silver" | "gold" | "platinum";
};

type MetricBlock = { bmi?: number | null; energyEstimateKcal?: number | null };
type Tip = { text: string; source?: string };
type HydrationItem = { time?: string; amountMl?: number };
type MovementItem = { time?: string; activity?: string; minutes?: number };
type MealItem = { time?: string; title?: string; items?: string[] };
type ScheduleItem = { time?: string; what?: string; details?: string };
type Plan = {
  id: string; createdAt: string; version?: string;
  metrics?: MetricBlock; hydration?: HydrationItem[]; movement?: MovementItem[];
  meals?: MealItem[]; tips?: Tip[]; schedule?: ScheduleItem[]; packsApplied?: string[];
};

function safeParse<T>(raw: string | null, fallback: T): T { if (!raw) return fallback; try { return JSON.parse(raw) as T; } catch { return fallback; } }
function readIntake(): IntakeData { return safeParse(localStorage.getItem(INTAKE_KEY), {} as IntakeData); }
function readSubscription(): Subscription { return safeParse(localStorage.getItem(SUB_KEY), {} as Subscription); }

function parseBool(v: string | null){ if(!v) return false; return v==="1" || v.toLowerCase()==="true" || v.toLowerCase()==="yes"; }
function useDemoMode(): boolean { const loc = useLocation(); const hash = (loc.hash||"").toLowerCase(); const qs = new URLSearchParams(loc.search); return hash.includes("demo") || parseBool(qs.get("demo")); }

function loadLatestPlan(): Plan | null {
  try {
    const idxRaw = localStorage.getItem(INDEX_KEY);
    const plansRaw = localStorage.getItem(PLANS_KEY);
    if (!plansRaw) return null;
    const plans: Record<string, Plan> = JSON.parse(plansRaw);
    if (idxRaw) {
      const index: string[] = JSON.parse(idxRaw);
      for (const id of index) if (plans[id]) return plans[id];
    }
    const arr = Object.values(plans);
    if (!arr.length) return null;
    return arr.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
  } catch { return null; }
}

function computeBMI(heightCm?: number | null, weightKg?: number | null): number | null {
  const h = Number(heightCm || 0); const w = Number(weightKg || 0); if (!h || !w) return null;
  const m = h/100; const bmi = w/(m*m); return Number.isFinite(bmi) ? Math.round(bmi*10)/10 : null;
}
function estimateKcal(weightKg?: number | null): number { const w = Number(weightKg || 0); return w>0 ? Math.round(w*30) : 2000; }

function backfillMetricsFromIntake(p: Plan, intake: IntakeData): Plan {
  const metrics: MetricBlock = { ...(p.metrics || {}) };
  if (metrics.bmi == null || Number.isNaN(metrics.bmi as number)) metrics.bmi = computeBMI(intake.heightCm, intake.weightKg);
  if (metrics.energyEstimateKcal == null || Number.isNaN(metrics.energyEstimateKcal as number)) metrics.energyEstimateKcal = estimateKcal(intake.weightKg);
  return { ...p, metrics };
}

function mealsFromIntake(intake: IntakeData): MealItem[] {
  const diet: DietType = intake.dietType || "vegetarian";
  const spice = intake.spiceTolerance || "medium";
  const note = spice === "low" ? "(mild)" : spice === "high" ? "(spicy)" : "(medium)";

  switch (diet) {
    case "vegan":
      return [
        { time: "07:30", title: `Breakfast ${note}`, items: ["Oats + seeds", "Banana", "Peanut butter (no dairy)"] },
        { time: "13:00", title: `Lunch ${note}`, items: ["Rajma/Chana", "Brown rice", "Veg sabzi"] },
        { time: "20:00", title: `Dinner ${note}`, items: ["Tofu stir-fry", "Salad", "Lemon water"] },
      ];
    case "eggetarian":
      return [
        { time: "07:30", title: `Breakfast ${note}`, items: ["Masala omelette (light oil)", "Toast", "Fruit"] },
        { time: "13:00", title: `Lunch ${note}`, items: ["Dal", "Veg sabzi", "Curd", "1–2 Roti/Rice"] },
        { time: "20:00", title: `Dinner ${note}`, items: ["Paneer/Tofu", "Veg soup", "Salad"] },
      ];
    case "non_vegetarian":
    case "all_eater":
      return [
        { time: "07:30", title: `Breakfast ${note}`, items: ["Oats + seeds", "Boiled egg", "Fruit"] },
        { time: "13:00", title: `Lunch ${note}`, items: ["Grilled chicken (handful)", "Dal", "Salad", "1–2 Roti/Rice"] },
        { time: "20:00", title: `Dinner ${note}`, items: ["Fish curry (light)", "Veg sabzi", "Roti/Rice"] },
      ];
    case "vegetarian":
    default:
      return [
        { time: "07:30", title: `Breakfast ${note}`, items: ["Poha/Upma", "Nuts", "Fruit"] },
        { time: "13:00", title: `Lunch ${note}`, items: ["Dal", "2 Roti", "Veg sabzi", "Curd"] },
        { time: "20:00", title: `Dinner ${note}`, items: ["Khichdi", "Mixed salad", "Buttermilk"] },
      ];
  }
}

function hydrateBackfill(p: Plan): Plan {
  if (p.hydration?.length) return p;
  return { ...p, hydration: [
    { time:"06:30", amountMl:250 },
    { time:"09:00", amountMl:300 },
    { time:"12:30", amountMl:300 },
    { time:"16:00", amountMl:250 },
    { time:"19:00", amountMl:250 }
  ] };
}

function movementBackfill(p: Plan): Plan {
  if (p.movement?.length) return p;
  return { ...p, movement: [
    { time:"07:00", activity:"Brisk walk", minutes:20 },
    { time:"18:00", activity:"Light yoga", minutes:15 }
  ] };
}

function tipsBackfill(p: Plan, intake: IntakeData): Plan {
  if (p.tips?.length) return p;
  const msgs: Tip[] = [
    { text: "Prioritize home-cooked meals; keep portions balanced." },
    { text: "Drink water steadily through the day; avoid chugging late night." },
    { text: "Short movement breaks if sitting >45 minutes." },
  ];
  if (intake.spiceTolerance) msgs.push({ text: `Spice tolerance noted: ${intake.spiceTolerance}.` });
  return { ...p, tips: msgs };
}

function buildDemoPlan(now = new Date()): Plan {
  const iso = now.toISOString();
  return {
    id: "demo-" + iso.slice(0, 19).replace(/[:T]/g, "-"),
    createdAt: iso,
    version: "v8-demo",
    metrics: { bmi: 23.2, energyEstimateKcal: 1950 },
    packsApplied: ["hypertension", "diabetes"],
    hydration: [{ time:"06:30", amountMl:250 },{ time:"09:00", amountMl:300 },{ time:"12:30", amountMl:300 },{ time:"16:00", amountMl:250 },{ time:"19:00", amountMl:250 }],
    movement: [{ time:"07:00", activity:"Brisk walk", minutes:20 },{ time:"18:00", activity:"Light yoga", minutes:15 }],
    meals: [{ time:"07:30", title:"Breakfast", items:["Oats + seeds","Fruit"] },{ time:"13:00", title:"Lunch", items:["Dal","2 Roti","Veg sabzi"] },{ time:"20:00", title:"Dinner", items:["Khichdi","Salad"] }],
    tips: [{ text:"Limit added salt; prefer herbs and lemon for flavor.", source:"hypertension" },{ text:"Distribute carbs through the day; include fiber.", source:"diabetes" }],
    schedule: [{ time:"06:00", what:"Wake", details:"2–3 deep breaths near window" },{ time:"07:00", what:"Walk", details:"Brisk walk 20 min" },{ time:"13:00", what:"Lunch", details:"Balanced plate" },{ time:"22:00", what:"Wind down", details:"Screen-off, dim lights" }],
  };
}

function toCSV(rows: string[][]): string { return rows.map(r => r.map(c => `"${(c ?? "").toString().replace(/"/g,'""')}"`).join(",")).join("\n"); }
function download(filename: string, data: BlobPart, type = "text/plain") { const blob = new Blob([data], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000); }

// --- NEW: Adapt AI stub → current Plan shape (non-destructive)
function adaptAiToPlan(ai: PlanJson, base: Plan): Plan {
  const meals: MealItem[] = [];
  const pushMeal = (time: string, title: string, items: string[] | undefined) => meals.push({ time, title, items: items || [] });

  // Map meals (use fixed anchor times for readability)
  pushMeal("07:30", "Breakfast", ai.meals?.breakfast || []);
  pushMeal("13:00", "Lunch", ai.meals?.lunch || []);
  pushMeal("16:30", "Snacks", ai.meals?.snacks || []);
  pushMeal("20:00", "Dinner", ai.meals?.dinner || []);

  // Hydration
  const hydration: HydrationItem[] = (ai.hydration || []).map(h => ({
    time: h.time, amountMl: h.ml
  }));

  // Movement (map simple strings to two anchor times)
  const movement: MovementItem[] = (ai.movement || []).map((m, i) => ({
    time: i === 0 ? "07:00" : i === 1 ? "18:00" : "",
    activity: m, minutes: i === 0 ? 15 : i === 1 ? 15 : undefined
  }));

  // Tips
  const tips: Tip[] = (ai.tips || []).map(t => ({ text: t }));

  // Keep schedule from base (non-destructive), add packs
  return {
    ...base,
    packsApplied: ai.packs_applied?.length ? ai.packs_applied : base.packsApplied,
    hydration: hydration.length ? hydration : base.hydration,
    meals: meals.some(m => (m.items || []).length) ? meals : base.meals,
    movement: movement.length ? movement : base.movement,
    tips: tips.length ? tips : base.tips,
  };
}

export default function HealthPlan() {
  const navigate = useNavigate();
  const demo = useDemoMode();
  const [packs, setPacks] = useState<PacksResult | null>(null);
  const [aiData, setAiData] = useState<PlanJson | null>(null);
  const mounted = useRef(false);

  const intake = useMemo(() => readIntake(), []);
  const sub = useMemo(() => readSubscription(), []);
  const aiOn = useMemo(() => getAiPlanEnabled(), []);

  const basePlan = useMemo<Plan>(() => {
    const existing = loadLatestPlan();
    if (demo) return buildDemoPlan();
    return existing ?? {
      id: "empty",
      createdAt: new Date().toISOString(),
      version: "v8",
      metrics: { bmi: null, energyEstimateKcal: null },
      hydration: [], movement: [], meals: [], tips: [], schedule: [],
    };
  }, [demo]);

  // Compute template/fallback plan first (keeps old behavior)
  const templatePlan = useMemo<Plan>(() => {
    let p = { ...basePlan };
    p = backfillMetricsFromIntake(p, intake);
    if (!p.meals?.length) p = { ...p, meals: mealsFromIntake(intake) };
    p = hydrateBackfill(p);
    p = movementBackfill(p);
    p = tipsBackfill(p, intake);
    return p;
  }, [basePlan, intake]);

  // Load packs (for intakeSummary packs_applied hint)
  useEffect(() => {
    if (mounted.current) return; mounted.current = true;
    (async () => { const res = await ensurePacksLoaded(); setPacks(res); })();
  }, []);

  // If toggle is ON and not demo, request AI stub once
  useEffect(() => {
    if (demo) return;
    if (!aiOn) return;
    (async () => {
      try {
        const packsApplied = packs?.ok ? packs.loaded : (templatePlan.packsApplied || []);
        const ai = await requestAiPlan(
          { packs_applied: packsApplied || [] },
          {} // aggregates can be added later from TodayTracker
        );
        setAiData(ai);
      } catch (e) {
        console.warn("AI Plan fetch failed; using template plan.", e);
        setAiData(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiOn, demo, packs?.ok, (packs?.loaded || []).join("|")]);

  // Merge AI data (non-destructive) if present
  const plan = useMemo<Plan>(() => {
    if (aiOn && aiData) return adaptAiToPlan(aiData, templatePlan);
    return templatePlan;
  }, [aiOn, aiData, templatePlan]);

  const personalizationBanner = useMemo(() => {
    const bits: string[] = [];
    if (sub?.name) bits.push(`for ${sub.name}`);
    if (intake.dietType) bits.push(`Diet: ${String(intake.dietType).replace("_","-")}`);
    if (intake.spiceTolerance) bits.push(`Spice: ${intake.spiceTolerance}`);
    if (aiOn && aiData) bits.push("AI Plan");
    return bits.length ? bits.join(" • ") : null;
  }, [sub?.name, intake.dietType, intake.spiceTolerance, aiOn, aiData]);

  const packsChip = useMemo(() => {
    const applied = plan.packsApplied?.length ? plan.packsApplied : [];
    if (!applied.length) return null;
    return (
      <div aria-label="Condition Packs applied" className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-white">
        <span>Condition Packs:</span><strong>{applied.join(", ")}</strong>
      </div>
    );
  }, [plan.packsApplied]);

  function onExportJSON(){ download(`plan_${plan.id}.json`, JSON.stringify(plan, null, 2), "application/json"); }
  function onExportScheduleCSV(){ const rows=[["time","what","details"],...(plan.schedule||[]).map(it=>[it.time||"",it.what||"",it.details||""])]; download(`plan_${plan.id}_schedule.csv`, toCSV(rows), "text/csv"); }
  function onExportHydrationCSV(){ const rows=[["time","amountMl"],...(plan.hydration||[]).map(it=>[it.time||"", String(it.amountMl??"")])]; download(`plan_${plan.id}_hydration.csv`, toCSV(rows), "text/csv"); }
  function onExportMealsCSV(){ const rows=[["time","title","items"],...(plan.meals||[]).map(it=>[it.time||"", it.title||"", (it.items||[]).join(" • ")])]; download(`plan_${plan.id}_meals.csv`, toCSV(rows), "text/csv"); }
  async function onExportAllZIP(){
    const summary = ["# GloWell Export","",`ID: ${plan.id}`,`Created: ${plan.createdAt}`,`Version: ${plan.version || "v8"}`,`Packs: ${(plan.packsApplied||[]).join(", ") || "-"}`,"","Files included:","- plan.json","- schedule.csv","- hydration.csv","- meals.csv","","Note: This bundle is a simple text package for quick sharing."].join("\n");
    const payload = [
      "===== README.txt =====\n"+summary,
      "\n\n===== plan.json =====\n"+JSON.stringify(plan, null, 2),
      "\n\n===== schedule.csv =====\n"+toCSV([["time","what","details"], ...(plan.schedule||[]).map(s=>[s.time||"",s.what||"",s.details||""])]),
      "\n\n===== hydration.csv =====\n"+toCSV([["time","amountMl"], ...(plan.hydration||[]).map(h=>[h.time||"", String(h.amountMl??"")])]),
      "\n\n===== meals.csv =====\n"+toCSV([["time","title","items"], ...(plan.meals||[]).map(m=>[m.time||"", m.title||"", (m.items||[]).join(" • ")])]),
    ].join("\n");
    download(`plan_${plan.id}_bundle.txt`, payload, "text/plain");
  }

  return (
    <div className="space-y-6">
      {/* Title Row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Health Plan</h1>
          <p className="mt-1 text-sm gw-muted">
            {demo ? "Public Demo (read-only)" : "Your latest plan (personalized if intake is saved)."}
          </p>
          {personalizationBanner && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs">
              <span>Personalized</span><span>•</span><strong>{personalizationBanner}</strong>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {packsChip}
          <div className="text-xs gw-muted">ID: <code>{plan.id}</code></div>
        </div>
      </div>

      {/* Metrics */}
      <section aria-label="Metrics" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="gw-card"><div className="text-xs gw-muted">BMI</div><div className="text-xl font-semibold">{plan.metrics?.bmi == null ? "—" : (plan.metrics.bmi as number).toFixed(1)}</div></div>
        <div className="gw-card"><div className="text-xs gw-muted">Energy (kcal)</div><div className="text-xl font-semibold">{plan.metrics?.energyEstimateKcal == null ? "—" : Math.round(plan.metrics.energyEstimateKcal as number)}</div></div>
        <div className="gw-card"><div className="text-xs gw-muted">Created</div><div className="text-sm">{new Date(plan.createdAt).toLocaleString()}</div></div>
      </section>

      {/* Hydration */}
      <section aria-label="Hydration" className="gw-card tinted">
        <h2 className="font-medium mb-3">Hydration</h2>
        <ul className="list-disc pl-5 space-y-1">
          {(plan.hydration || []).map((h,i)=> <li key={i}><strong>{h.time||"—"}</strong> — {h.amountMl ?? "—"} ml</li>)}
          {!plan.hydration?.length && <li className="gw-muted">No hydration items.</li>}
        </ul>
      </section>

      {/* Movement */}
      <section aria-label="Movement" className="gw-card tinted">
        <h2 className="font-medium mb-3">Movement</h2>
        <ul className="list-disc pl-5 space-y-1">
          {(plan.movement || []).map((m,i)=> <li key={i}><strong>{m.time||"—"}</strong> — {m.activity || "—"} ({m.minutes ?? "—"} min)</li>)}
          {!plan.movement?.length && <li className="gw-muted">No movement items.</li>}
        </ul>
      </section>

      {/* Meals */}
      <section aria-label="Meals" className="gw-card tinted">
        <h2 className="font-medium mb-3">Meals</h2>
        <ul className="list-disc pl-5 space-y-1">
          {(plan.meals || []).map((m,i)=> <li key={i}><strong>{m.time||"—"}</strong> — {m.title || "—"} {(m.items||[]).length ? `• ${(m.items||[]).join(", ")}` : ""}</li>)}
          {!plan.meals?.length && <li className="gw-muted">No meals listed.</li>}
        </ul>
      </section>

      {/* Tips */}
      <section aria-label="Tips" className="gw-card tinted">
        <h2 className="font-medium mb-3">Tips</h2>
        <ul className="list-disc pl-5 space-y-1">
          {(plan.tips || []).map((t,i)=> <li key={i}>{t.text} {t.source ? <span className="text-xs gw-muted">({t.source})</span> : null}</li>)}
          {!plan.tips?.length && <li className="gw-muted">No tips.</li>}
        </ul>
      </section>

      {/* Schedule */}
      <section aria-label="Schedule" className="gw-card">
        <h2 className="font-medium mb-3">Schedule</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left"><th className="border-b py-2 pr-3">Time</th><th className="border-b py-2 pr-3">What</th><th className="border-b py-2">Details</th></tr></thead>
            <tbody>
              {(plan.schedule || []).map((s,i)=> (
                <tr key={i} className="align-top">
                  <td className="border-b py-2 pr-3">{s.time || "—"}</td>
                  <td className="border-b py-2 pr-3">{s.what || "—"}</td>
                  <td className="border-b py-2">{s.details || "—"}</td>
                </tr>
              ))}
              {!plan.schedule?.length && <tr><td colSpan={3} className="border-b py-2 gw-muted">No schedule items.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions */}
      <section aria-label="Actions" className="flex flex-wrap gap-2">
        <button className="gw-btn" onClick={()=>navigate("/health-form")}>Open Intake</button>
        <button className="gw-btn" onClick={()=>navigate("/plans")}>Open Plans History</button>
        <button className="gw-btn" onClick={onExportJSON}>Export JSON</button>
        <button className="gw-btn" onClick={onExportScheduleCSV}>Export Schedule CSV</button>
        <button className="gw-btn" onClick={onExportHydrationCSV}>Export Hydration CSV</button>
        <button className="gw-btn" onClick={onExportMealsCSV}>Export Meals CSV</button>
        <button className="gw-btn" onClick={onExportAllZIP}>Export All (Bundle)</button>
      </section>
    </div>
  );
}
