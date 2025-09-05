// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const PLANS_KEY = "glowell:plans";         // map: { [id]: PlanSnapshot }
const INDEX_KEY = "glowell:plans:index";   // array: newest-first ids
const INTAKE_V2_KEY = "glowell:intake.v2"; // to show quick summary

type PlanSnapshot = {
  id: string;
  createdAt?: string;
  version?: string | number;
  metrics?: { bmi?: number | null; energyEstimateKcal?: number | null };
  packsApplied?: string[];
  readme?: string;
  // other fields ignored safely
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const val = JSON.parse(raw);
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

function usePlans() {
  const [index, setIndex] = useState<string[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanSnapshot>>({});

  useEffect(() => {
    const idx = loadJSON<any>(INDEX_KEY, []);
    setIndex(Array.isArray(idx) ? idx : []);
    const map = loadJSON<Record<string, PlanSnapshot>>(PLANS_KEY, {});
    setPlans(map && typeof map === "object" ? map : {});
  }, []);

  const latestId = useMemo(() => (Array.isArray(index) && index.length ? index[0] : ""), [index]);
  const latestPlan = latestId && plans ? (plans[latestId] as PlanSnapshot | undefined) : undefined;

  const stats = useMemo(() => {
    const ids = Array.isArray(index) ? index : [];
    const total = ids.length;
    let bmiSum = 0, bmiCount = 0;
    ids.forEach((id) => {
      const p = plans[id];
      const bmi = p?.metrics?.bmi;
      if (typeof bmi === "number") { bmiSum += bmi; bmiCount++; }
    });
    const avgBMI = bmiCount ? Math.round((bmiSum / bmiCount) * 10) / 10 : null;
    const lastCreatedISO = latestPlan?.createdAt || null;
    return { total, avgBMI, lastCreatedISO };
  }, [index, plans, latestPlan?.createdAt]);

  return { index, plans, latestId, latestPlan, stats };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { index, plans, latestId, latestPlan, stats } = usePlans();

  // Quick intake summary (optional)
  const intake = loadJSON<any>(INTAKE_V2_KEY, null);
  const dietLine = intake?.profile ? `${intake.profile.dietType || "—"} · ${intake.profile.cuisine || "—"}` : "—";
  const archetype = intake?.schedule?.archetypeId || "—";
  const dosha = (() => {
    const d = intake?.profile?.dosha || { kapha: 5, pitta: 5, vata: 5 };
    const arr = [{k:"Kapha",v:d.kapha},{k:"Pitta",v:d.pitta},{k:"Vata",v:d.vata}].sort((a,b)=>b.v-a.v);
    if (arr[0].v === arr[2].v) return "Tridoshic-balanced";
    if (arr[0].v === arr[1].v) return `${arr[0].k}-${arr[1].k}`;
    return arr[0].k;
  })();

  function copy(text: string) {
    try { navigator.clipboard.writeText(text); alert("Link copied!"); } catch { alert(text); }
  }

  const demoURL = `${location.origin}/health-plan#demo`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="gw-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm gw-muted">Your shortcuts, latest plan, and quick actions.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="gw-btn" onClick={() => navigate("/health-form")}>Open Health Form</button>
            <button className="gw-btn" onClick={() => navigate("/intake-review")}>Open Confirmation</button>
            <button className="gw-btn" onClick={() => navigate("/health-plan")}>Open Health Plan</button>
            <button className="gw-btn" onClick={() => navigate("/plans")}>Open Plans History</button>
          </div>
        </div>
      </section>

      {/* Demo shortcuts */}
      <section className="gw-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-medium">Public Demo</h2>
            <p className="text-sm gw-muted">Read-only plan at <code>/health-plan#demo</code></p>
          </div>
          <div className="flex gap-2">
            <button className="gw-btn" onClick={() => navigate("/health-plan#demo")}>Open Public Demo</button>
            <button className="gw-btn" onClick={() => copy(demoURL)}>Copy Demo Link</button>
          </div>
        </div>
      </section>

      {/* Tiles */}
      <section className="gw-card">
        <div className="grid gap-3 md:grid-cols-4">
          <Tile label="Total plans saved" value={String(stats.total)} />
          <Tile label="Average BMI (saved plans)" value={stats.avgBMI ?? "—"} />
          <Tile label="Latest plan created" value={stats.lastCreatedISO ? new Date(stats.lastCreatedISO).toLocaleString() : "—"} />
          <Tile label="Intake summary" value={`${dietLine} • ${archetype} • ${dosha}`} />
        </div>
      </section>

      {/* Latest snapshot quick actions */}
      <section className="gw-card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-medium">Latest snapshot</h2>
            <p className="text-sm gw-muted">
              {latestId ? <>ID <code>{latestId}</code>{latestPlan?.version ? <> · v{latestPlan.version}</> : null}</> : "No snapshots yet."}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="gw-btn" disabled={!latestId} onClick={() => navigate(`/plans/${latestId}`)}>Open</button>
            <button
              className="gw-btn"
              disabled={!latestId}
              onClick={() => copy(`${location.origin}/plans/${latestId}`)}
            >
              Copy Link
            </button>
          </div>
        </div>

        {latestPlan && (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Tile label="BMI" value={latestPlan.metrics?.bmi ?? "—"} />
            <Tile label="Energy (kcal est.)" value={latestPlan.metrics?.energyEstimateKcal ?? "—"} />
            <Tile label="Packs applied" value={(latestPlan.packsApplied || []).join(", ") || "—"} />
          </div>
        )}
      </section>

      {/* Stored plans (brief list) */}
      <section className="gw-card">
        <h2 className="font-medium mb-2">Recent plans</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="border-b py-2 pr-3">ID</th>
                <th className="border-b py-2 pr-3">Created</th>
                <th className="border-b py-2 pr-3">BMI</th>
                <th className="border-b py-2 pr-3">kcal est.</th>
                <th className="border-b py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(index) ? index.slice(0, 8) : []).map((id) => {
                const p = plans[id] as PlanSnapshot | undefined;
                return (
                  <tr key={id}>
                    <td className="border-b py-2 pr-3"><code>{id}</code></td>
                    <td className="border-b py-2 pr-3">{p?.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</td>
                    <td className="border-b py-2 pr-3">{p?.metrics?.bmi ?? "—"}</td>
                    <td className="border-b py-2 pr-3">{p?.metrics?.energyEstimateKcal ?? "—"}</td>
                    <td className="border-b py-2">
                      <button className="gw-btn" onClick={() => navigate(`/plans/${id}`)}>Open</button>
                    </td>
                  </tr>
                );
              })}
              {(!Array.isArray(index) || index.length === 0) && (
                <tr><td className="border-b py-2 gw-muted" colSpan={5}>No plans saved yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded border bg-white px-3 py-2">
      <div className="text-xs gw-muted">{label}</div>
      <div className="text-lg">{(value === 0 || value) ? String(value) : "—"}</div>
    </div>
  );
}
