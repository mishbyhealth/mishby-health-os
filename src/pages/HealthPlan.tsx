// src/pages/HealthPlan.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Storage keys
const PLANS_KEY = "glowell:plans";
const INDEX_KEY = "glowell:plans:index";
const INTAKE_V2_KEY = "glowell:intake.v2";

// Engine + libraries
import { assemblePlanFromTemplates, type Plan, type IntakeSummary } from "../utils/engine_templates";
import type { DietType, Cuisine } from "../utils/dietLibrary";
import { ensurePacksLoaded } from "../utils/packs"; // runtime loader (safe if packs missing)

// --- utils ---
function load<T>(key: string, fb: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fb; } catch { return fb; }
}
function save<T>(key: string, val: T){ try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function uid(){ return "PLN-" + new Date().toISOString().slice(0,10).replaceAll("-","") + "-" + Math.random().toString(36).slice(2,8); }
function download(filename:string, text:string, type="text/plain"){
  const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function toCSV(rows: Array<Record<string, any>>){
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v:any)=> `"${String(v ?? "").replaceAll('"','""')}"`;
  return [cols.join(","), ...rows.map(r=> cols.map(c=>esc(r[c])).join(","))].join("\n");
}
function yes(msg:string){ try { return confirm(msg); } catch { return true; } }

// Derive dosha label from scores
function labelDosha(d?: {kapha:number; pitta:number; vata:number}){
  const d0 = d || { kapha:5, pitta:5, vata:5 };
  const arr = [{k:"Kapha",v:d0.kapha},{k:"Pitta",v:d0.pitta},{k:"Vata",v:d0.vata}].sort((a,b)=>b.v-a.v);
  if (arr[0].v === arr[2].v) return "Tridoshic-balanced";
  if (arr[0].v === arr[1].v) return `${arr[0].k}-${arr[1].k}`;
  return arr[0].k;
}

export default function HealthPlan(){
  const nav = useNavigate();
  const [search] = useSearchParams();
  const isDemo = location.hash.includes("#demo") || search.get("demo")==="1";
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planId, setPlanId] = useState<string>("empty");
  const once = useRef(false);

  // Build intake summary for the engine
  const intake = load<any>(INTAKE_V2_KEY, null);
  const summary: IntakeSummary = useMemo(() => {
    const diet: DietType = (intake?.profile?.dietType || "vegetarian") as DietType;
    const cuisine: Cuisine | "Generic" = (intake?.profile?.cuisine || "Generic") as Cuisine | "Generic";
    const times = intake?.schedule?.times || { wake:"06:30", lunch:"13:00", dinner:"20:30", leave:intake?.schedule?.times?.leave, return:intake?.schedule?.times?.return };
    const chronic = intake?.health?.chronic || [];
    const concerns = (intake?.today?.chips || []).concat(intake?.health?.concerns || []);
    const goals = intake?.health?.goals || [];
    const gender = intake?.profile?.gender || "";
    const womens = intake?.health?.womens || null;
    const doshaLabel = labelDosha(intake?.profile?.dosha);
    return {
      dietType: diet,
      cuisine,
      archetypeTimes: { wake: times.wake || "06:30", leave: times.leave, return: times.return, lunch: times.lunch || "13:00", dinner: times.dinner || "20:30", commuteMins: times.commuteMins || 0, breaks: times.breaks || [] },
      chronic, concerns, goals, gender, womens,
      doshaLabel,
    };
  }, [JSON.stringify(intake)]);

  // Build plan from templates + optional pack tips at runtime
  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const base = assemblePlanFromTemplates(summary);

    // Append runtime condition pack tips if packs JSONs exist
    ensurePacksLoaded().then(packs => {
      try {
        const extraTips: string[] = [];
        (base.packsApplied || []).forEach(p => {
          const t = packs?.[p]?.tips || [];
          t.forEach((it:any)=> extraTips.push(it?.text || String(it)));
        });
        const merged: Plan = { ...base, tips: [...base.tips, ...extraTips] };
        setPlan(merged);
        maybeSaveSnapshot(merged);
      } catch {
        setPlan(base);
        maybeSaveSnapshot(base);
      }
    }).catch(() => {
      setPlan(base);
      maybeSaveSnapshot(base);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function maybeSaveSnapshot(p: Plan){
    if (isDemo) return; // never save demo
    const id = uid();
    setPlanId(id);
    const map = load<Record<string, any>>(PLANS_KEY, {});
    const idx = load<string[]>(INDEX_KEY, []);
    const snap = {
      id,
      createdAt: new Date().toISOString(),
      version: "v8",
      metrics: p.metrics || {},
      packsApplied: p.packsApplied || [],
      readme: p.readme || "",
    };
    const nextMap = { ...map, [id]: snap };
    const nextIdx = [id, ...idx.filter(x=>x!==id)].slice(0, 200);
    save(PLANS_KEY, nextMap);
    save(INDEX_KEY, nextIdx);
  }

  // Exports
  function exportJSON(){
    if (!plan) return;
    download(`glowell_plan_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({ id:planId, plan }, null, 2), "application/json");
  }
  function exportHydrationCSV(){
    if (!plan) return;
    const rows = plan.hydration.map(h=>({ time:h.at, label:h.label }));
    download("hydration.csv", toCSV(rows), "text/csv");
  }
  function exportMealsCSV(){
    if (!plan) return;
    const rows = plan.meals.flatMap(m => (m.items||[]).map(it => ({ slot:m.slot, at:m.at||"", item:it.name })));
    download("meals.csv", toCSV(rows), "text/csv");
  }
  function exportScheduleCSV(){
    if (!plan) return;
    const rows = plan.schedule.map(b => ({ time:b.at, type:b.type, label:b.label }));
    download("schedule.csv", toCSV(rows), "text/csv");
  }

  // Header chips
  const headerLine = useMemo(() => {
    const diet = intake?.profile?.dietType || "—";
    const cuisine = intake?.profile?.cuisine || "—";
    const arche = intake?.schedule?.archetypeId || "—";
    const dosha = labelDosha(intake?.profile?.dosha);
    return `${arche} · ${diet} · ${cuisine} · ${dosha}`;
  }, [intake]);

  return (
    <div className="space-y-6">
      <section className="gw-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Health Plan</h1>
            <p className="text-sm gw-muted">
              {isDemo ? "Public Demo (read-only)" : "Your latest plan (personalized if intake is saved)."}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="gw-btn" onClick={()=>nav("/health-form")}>Edit Intake</button>
            <button className="gw-btn" onClick={()=>nav("/intake-review")}>Open Confirmation</button>
            <button className="gw-btn" onClick={exportJSON}>Export JSON</button>
            <button className="gw-btn" onClick={exportScheduleCSV}>Schedule CSV</button>
            <button className="gw-btn" onClick={exportHydrationCSV}>Hydration CSV</button>
            <button className="gw-btn" onClick={exportMealsCSV}>Meals CSV</button>
          </div>
        </div>

        {/* header chips */}
        <div className="mt-3" style={{display:"flex", flexWrap:"wrap", gap:8}}>
          <span className="gw-btn" style={{cursor:"default"}}>{headerLine}</span>
          {(plan?.packsApplied || []).map(p =>
            <span key={p} className="gw-btn" style={{cursor:"default"}}>{p}</span>
          )}
        </div>
      </section>

      {!plan && (
        <section className="gw-card">
          <div className="gw-muted">Building your plan…</div>
        </section>
      )}

      {plan && (
        <>
          {/* Metrics */}
          <section className="gw-card">
            <div className="grid gap-3 md:grid-cols-3">
              <Tile label="BMI" value={intake?.profile?.bmi ?? "—"} />
              <Tile label="Energy (kcal)" value={plan.metrics?.energyEstimateKcal ?? "—"} />
              <Tile label="Created" value={new Date().toLocaleString()} />
            </div>
          </section>

          {/* Hydration */}
          <Section title="Hydration">
            <List bullets={plan.hydration.map(h => `${h.at} — ${h.label}`)} empty="No hydration items." />
          </Section>

          {/* Movement */}
          <Section title="Movement">
            <List bullets={plan.movement.map(mv => `${mv.at} — ${mv.label}`)} empty="No movement items." />
          </Section>

          {/* Meals */}
          <Section title="Meals">
            <div className="grid gap-3 md:grid-cols-2">
              {plan.meals.map(m => (
                <div key={m.slot} className="rounded border bg-white px-3 py-2">
                  <div className="text-sm"><strong>{titleCase(m.slot)}</strong>{m.at ? ` • ${m.at}` : ""}</div>
                  <ul>
                    {(m.items || []).map(it => <li key={it.id}>• {it.name}</li>)}
                  </ul>
                  {!!(m.notes && m.notes.length) && (
                    <div className="text-xs gw-muted mt-1">{m.notes.join(" ")}</div>
                  )}
                </div>
              ))}
            </div>
            {!plan.meals.length && <div className="gw-muted">No meals listed.</div>}
          </Section>

          {/* Tips */}
          <Section title="Tips">
            <List bullets={(plan.tips || []).map(t => `• ${t}`)} empty="No tips." />
          </Section>

          {/* Schedule (plain view) */}
          <Section title="Schedule (overview)">
            <List bullets={plan.schedule.map(s => `${s.at} — ${titleCase(s.type)}: ${s.label}`)} empty="No schedule items." />
          </Section>

          {/* Danger zone */}
          {!isDemo && (
            <section className="gw-card">
              <div className="flex items-center justify-between">
                <div className="text-sm gw-muted">
                  Snapshot saved to Plans History as soon as the plan loaded.
                </div>
                <button
                  className="gw-btn"
                  onClick={()=>{
                    if (!yes("Clear all saved plans from this device?")) return;
                    save(PLANS_KEY, {}); save(INDEX_KEY, []); alert("Cleared.");
                  }}
                >
                  Clear Saved Plans
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }:{title:string; children:React.ReactNode}){
  return (
    <section className="gw-card">
      <h2 className="font-medium text-lg mb-2">{title}</h2>
      {children}
    </section>
  );
}
function Tile({label, value}:{label:string; value:any}){
  return (
    <div className="rounded border bg-white px-3 py-2">
      <div className="text-xs gw-muted">{label}</div>
      <div className="text-lg">{(value===0 || value) ? String(value) : "—"}</div>
    </div>
  );
}
function List({ bullets, empty }:{ bullets: string[]; empty: string }){
  if (!bullets.length) return <div className="gw-muted">{empty}</div>;
  return <ul>{bullets.map((b,i)=><li key={i} style={{margin:"6px 0"}}>{b}</li>)}</ul>;
}
function titleCase(s:string){ return s.charAt(0).toUpperCase() + s.slice(1); }
