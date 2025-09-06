// src/pages/Plans.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type PlanIndexItem = {
  id: string;
  createdAt?: string;
  version?: string | number;
  bmi?: number | null;
  energyEstimateKcal?: number | null;
  packs?: string[];
};

const INDEX_KEY = "glowell:plans:index";

/** Fallback: discover any saved plan ids from localStorage when index is missing */
function discoverPlanIdsFromLocalStorage(): string[] {
  const ids = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    if (k.startsWith("PLN-")) ids.add(k.replace(/^PLN-/, ""));
    if (/^plan_/.test(k)) ids.add(k); // very old style
  }
  return Array.from(ids);
}

/** Load index or synthesize a lightweight one */
function loadIndex(): PlanIndexItem[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr)) return arr;
  } catch {}
  return discoverPlanIdsFromLocalStorage().map((id) => ({ id }));
}

function fmtDate(s?: string) {
  if (!s) return "—";
  const t = Date.parse(s);
  if (isNaN(t)) return s;
  return new Date(t).toLocaleString();
}

export default function Plans() {
  const nav = useNavigate();
  const [rows, setRows] = useState<PlanIndexItem[]>([]);

  useEffect(() => {
    setRows(loadIndex());
  }, []);

  const count = rows.length;
  const hasAny = count > 0;

  const tableRows = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-4">
      {/* Header / summary */}
      <section className="gw-card tinted">
        <h1 className="text-xl font-semibold">Plans History</h1>
        <p className="gw-muted text-sm">
          Saved plans detected: <strong>{count}</strong>. This lightweight view works with any
          existing storage layout. Open a plan to view/print/export.
        </p>
      </section>

      {/* List */}
      <section className="gw-card">
        {!hasAny ? (
          <div className="gw-empty">No saved plans yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="gw-tr">
                  <th className="gw-th">ID</th>
                  <th className="gw-th">Date</th>
                  <th className="gw-th">Version</th>
                  <th className="gw-th">BMI</th>
                  <th className="gw-th">kCal</th>
                  <th className="gw-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((p, i) => (
                  <tr key={p.id || i} className="gw-tr">
                    <td className="gw-td" style={{ whiteSpace: "nowrap" }}>
                      {p.id || "—"}
                    </td>
                    <td className="gw-td">{fmtDate(p.createdAt)}</td>
                    <td className="gw-td">{p.version ?? "—"}</td>
                    <td className="gw-td">{p.bmi ?? "—"}</td>
                    <td className="gw-td">{p.energyEstimateKcal ?? "—"}</td>
                    <td className="gw-td">
                      <button
                        className="gw-btn"
                        onClick={() => nav(`/plans/${encodeURIComponent(p.id)}`)}
                      >
                        Open Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
