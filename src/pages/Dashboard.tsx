import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Snapshot = {
  id: string;
  createdAt?: string;
  plan?: { metrics?: { bmi?: number; energyEstimateKcal?: number } };
};
type PlansMap = Record<string, Snapshot>;

const PLANS_KEY = "glowell:plans";

function loadPlans(): PlansMap {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [plansMap, setPlansMap] = useState<PlansMap>({});

  useEffect(() => {
    setPlansMap(loadPlans());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PLANS_KEY) setPlansMap(loadPlans());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { count, last } = useMemo(() => {
    const list = Object.values(plansMap);
    list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return {
      count: list.length,
      last: list[0],
    };
  }, [plansMap]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm opacity-70">Saved Plans</div>
          <div className="text-2xl font-bold">{count}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm opacity-70">Last Saved At</div>
          <div className="text-lg">{formatDateTime(last?.createdAt)}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm opacity-70">Last Plan — BMI / kcal</div>
          <div className="text-lg">
            {last?.plan?.metrics?.bmi ?? "—"} / {last?.plan?.metrics?.energyEstimateKcal ?? "—"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="border rounded px-3 py-1" onClick={() => navigate("/health-plan")}>+ New Plan</button>
        <button className="border rounded px-3 py-1" onClick={() => navigate("/plans")}>Open Plans</button>
      </div>

      <p className="text-xs opacity-70">
        Note: Data is stored only in your browser (localStorage). Clearing site data or switching browsers will remove it.
      </p>
    </div>
  );
}
