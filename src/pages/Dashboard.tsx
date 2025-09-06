// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type PlanIndexItem = {
  id: string;
  createdAt?: string;
  version?: string | number;
  bmi?: number;
  energyEstimateKcal?: number;
};

const INDEX_KEY = "glowell:plans:index";

// Helper: robustly discover plan IDs if index is missing
function discoverPlanIdsFromLocalStorage(): string[] {
  const ids = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    if (k.startsWith("PLN-")) {
      ids.add(k.replace(/^PLN-/, ""));
    }
    // some old saves looked like "plan_<timestamp>Z"
    if (/^plan_/.test(k)) ids.add(k);
  }
  return Array.from(ids);
}

function loadIndex(): PlanIndexItem[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  // synthesize minimal index if not present
  return discoverPlanIdsFromLocalStorage().map((id) => ({ id }));
}

function pickLatest(items: PlanIndexItem[]): PlanIndexItem | undefined {
  if (!items.length) return;
  // prefer createdAt, else fall back to last item
  const withDates = items
    .map((p) => ({ ...p, t: p.createdAt ? Date.parse(p.createdAt) : 0 }))
    .sort((a, b) => (b.t || 0) - (a.t || 0));
  return withDates[0] || items[items.length - 1];
}

export default function Dashboard() {
  const nav = useNavigate();
  const [index, setIndex] = useState<PlanIndexItem[]>([]);
  const [dailyLogsCount, setDailyLogsCount] = useState<number>(0);

  useEffect(() => {
    setIndex(loadIndex());

    // best-effort count for daily logs (different keys may be used across versions)
    let count = 0;
    try {
      const k1 = localStorage.getItem("glowell:todayLogs");
      if (k1) count += (JSON.parse(k1) as any[])?.length || 0;
    } catch {}
    try {
      const k2 = localStorage.getItem("glowell:dailyLogs");
      if (k2) count += (JSON.parse(k2) as any[])?.length || 0;
    } catch {}
    setDailyLogsCount(count);
  }, []);

  const latest = useMemo(() => pickLatest(index), [index]);
  const totalPlans = index.length;

  return (
    <div className="space-y-4">
      {/* Render check */}
      <section className="gw-card">
        <div className="text-sm gw-muted">Render check</div>
        <div className="mt-1">Dashboard is loaded ✅</div>
      </section>

      {/* Stats */}
      <section className="gw-card tinted">
        <div className="grid" style={{ gap: 16, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <div className="gw-card" style={{ padding: 16 }}>
            <div className="text-sm gw-muted">Total Plans</div>
            <div className="text-2xl font-semibold mt-1">{totalPlans}</div>
          </div>

          <div className="gw-card" style={{ padding: 16 }}>
            <div className="text-sm gw-muted">Latest BMI</div>
            <div className="text-2xl font-semibold mt-1">
              {latest?.bmi != null ? latest.bmi : "—"}
            </div>
          </div>

          <div className="gw-card" style={{ padding: 16 }}>
            <div className="text-sm gw-muted">Latest Energy (kcal)</div>
            <div className="text-2xl font-semibold mt-1">
              {latest?.energyEstimateKcal != null ? latest.energyEstimateKcal : 2000}
            </div>
          </div>

          <div className="gw-card" style={{ padding: 16 }}>
            <div className="text-sm gw-muted">Daily logs saved</div>
            <div className="text-2xl font-semibold mt-1">{dailyLogsCount}</div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="gw-card tinted">
        <h2 className="font-medium mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button className="gw-btn" onClick={() => nav("/health-form")}>Open Intake</button>
          <button className="gw-btn" onClick={() => nav("/health-plan")}>Open Health Plan</button>
          <button className="gw-btn" onClick={() => nav("/plans")}>Open Plans History</button>
          <button
            className="gw-btn"
            disabled={!latest?.id}
            onClick={() => latest?.id && nav(`/plans/${encodeURIComponent(latest.id)}`)}
          >
            Open Latest Snapshot
          </button>

          {/* Public demo tools */}
          <button className="gw-btn" onClick={() => (window.location.href = "/health-plan#demo")}>
            Open Public Demo
          </button>
          <button
            className="gw-btn"
            onClick={async () => {
              await navigator.clipboard.writeText(`${location.origin}/health-plan#demo`);
              alert("Demo link copied!");
            }}
          >
            Copy Demo Link
          </button>
        </div>

        <div className="mt-2 text-xs gw-muted">
          Latest:{" "}
          {latest?.id ? latest.id : "—"}
          {latest?.createdAt ? ` • ${new Date(latest.createdAt).toLocaleString()}` : ""}
        </div>
      </section>
    </div>
  );
}
