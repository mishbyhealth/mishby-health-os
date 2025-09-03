import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Snapshot = {
  id: string;
  version?: string;
  createdAt?: string; // ISO
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

export default function PlansHistory() {
  const navigate = useNavigate();
  const [plansMap, setPlansMap] = useState<PlansMap>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    setPlansMap(loadPlans());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PLANS_KEY) setPlansMap(loadPlans());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const rows = useMemo(() => {
    try {
      const list = Object.values(plansMap);
      list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      if (!q.trim()) return list;
      const s = q.toLowerCase();
      return list.filter(r => {
        const bmi = r?.plan?.metrics?.bmi ?? "";
        const kcal = r?.plan?.metrics?.energyEstimateKcal ?? "";
        return (
          String(r.id).toLowerCase().includes(s) ||
          String(r.version ?? "").toLowerCase().includes(s) ||
          String(formatDateTime(r.createdAt)).toLowerCase().includes(s) ||
          String(bmi).toLowerCase().includes(s) ||
          String(kcal).toLowerCase().includes(s)
        );
      });
    } catch {
      return [];
    }
  }, [plansMap, q]);

  function handleOpen(id: string) {
    navigate(`/plans/${id}`);
  }
  function handleDelete(id: string) {
    if (!confirm(`Delete plan ${id}?`)) return;
    const next = { ...plansMap };
    delete next[id];
    localStorage.setItem(PLANS_KEY, JSON.stringify(next));
    setPlansMap(next);
  }
  function handleClearAll() {
    if (!confirm("Clear ALL saved plans?")) return;
    localStorage.removeItem(PLANS_KEY);
    setPlansMap({});
  }
  function handleExportAll() {
    const blob = new Blob([JSON.stringify(plansMap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plans-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  async function handleImportAll(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as PlansMap;
      const merged: PlansMap = { ...plansMap, ...imported };
      localStorage.setItem(PLANS_KEY, JSON.stringify(merged));
      setPlansMap(merged);
      alert("Imported.");
    } catch {
      alert("Invalid file.");
    } finally {
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Plans History</h1>

      <div className="flex flex-wrap gap-2">
        <button className="border rounded px-3 py-1" onClick={() => navigate("/health-plan")}>+ New Plan</button>
        <button className="border rounded px-3 py-1" onClick={handleExportAll}>Export All (JSON)</button>
        <label className="border rounded px-3 py-1 cursor-pointer">
          Import (JSON)
          <input type="file" accept="application/json" className="hidden" onChange={handleImportAll} />
        </label>
        <button className="border rounded px-3 py-1" onClick={handleClearAll}>Clear All</button>
      </div>

      <input
        className="border rounded px-3 py-2 w-full md:w-1/2"
        placeholder="Search by ID, date/time, version, BMI, kcal…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">Version</th>
              <th className="py-2 pr-3">BMI</th>
              <th className="py-2 pr-3">Kcal</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="py-3 opacity-70" colSpan={6}>No plans found.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="py-2 pr-3">{formatDateTime(p.createdAt)}</td>
                <td className="py-2 pr-3">{p.id}</td>
                <td className="py-2 pr-3">{p.version ?? "—"}</td>
                <td className="py-2 pr-3">{p.plan?.metrics?.bmi ?? "—"}</td>
                <td className="py-2 pr-3">{p.plan?.metrics?.energyEstimateKcal ?? "—"}</td>
                <td className="py-2 pr-3">
                  <div className="flex gap-2">
                    <button className="border rounded px-2 py-1" onClick={() => handleOpen(p.id)}>Open</button>
                    <button className="border rounded px-2 py-1" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
