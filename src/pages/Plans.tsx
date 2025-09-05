import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * This page is intentionally lightweight and crash-proof.
 * It reads whatever it can from localStorage and shows a simple list.
 * It will work even if only some keys are present.
 */

type PlanIndexItem = {
  id: string;
  date?: string;
  version?: string | number;
  bmi?: number;
  kcal?: number;
};

const PLANS_KEY = "glowell:plans";         // optional legacy list of ids
const INDEX_KEY = "glowell:plans:index";   // optional rich index

function readJSON<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function scanAllPlanKeys(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    if (k.startsWith("glowell:plan:")) {
      ids.push(k.replace("glowell:plan:", ""));
    }
  }
  return ids;
}

export default function Plans() {
  const [items, setItems] = useState<PlanIndexItem[]>([]);

  useEffect(() => {
    // Prefer the rich index if available
    const index = readJSON<PlanIndexItem[]>(INDEX_KEY);
    if (Array.isArray(index) && index.length) {
      setItems(index);
      return;
    }

    // Fallback: try list of ids
    const idsFromList = readJSON<string[]>(PLANS_KEY) || [];
    let ids = Array.isArray(idsFromList) ? idsFromList : [];

    // Final fallback: scan all keys
    if (!ids.length) {
      ids = scanAllPlanKeys();
    }

    // Build minimal items from ids
    const minimal = ids.map((id) => ({ id })) as PlanIndexItem[];
    setItems(minimal);
  }, []);

  const count = items.length;

  const pretty = useMemo(
    () =>
      items.map((it) => ({
        id: it.id,
        date: it.date || "—",
        version: it.version ?? "—",
        bmi: typeof it.bmi === "number" ? it.bmi.toFixed(1) : "—",
        kcal: typeof it.kcal === "number" ? Math.round(it.kcal) : "—",
      })),
    [items]
  );

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="gw-card tinted p-6 md:p-8 rounded-2xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Plans History</h1>
        <p className="opacity-80 text-sm md:text-base">
          Saved plans detected: <b>{count}</b>. This lightweight view works with any existing storage layout.
        </p>

        {count === 0 ? (
          <div className="mt-6 gw-card p-4 rounded-xl">
            <p className="text-sm opacity-80">
              No saved plans found yet. Create one from{" "}
              <Link to="/health-form" className="underline">Health Form</Link>{" "}
              or open the{" "}
              <a className="underline" href="/health-plan#demo">Demo Plan</a>.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left opacity-70">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Version</th>
                  <th className="py-2 pr-3">BMI</th>
                  <th className="py-2 pr-3">kCal</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pretty.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 pr-3 font-mono break-all">{row.id}</td>
                    <td className="py-2 pr-3">{row.date}</td>
                    <td className="py-2 pr-3">{String(row.version)}</td>
                    <td className="py-2 pr-3">{row.bmi}</td>
                    <td className="py-2 pr-3">{row.kcal}</td>
                    <td className="py-2 pr-3">
                      {/* Generic open — your HealthPlan page may read from current/local storage */}
                      <Link to="/health-plan" className="px-3 py-1 rounded-full border">
                        Open Plan
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs opacity-70">
          Tip: This page won’t crash even if the index is missing. Later we can wire a “View by ID” deep-link once the HealthPlan reader API is finalized.
        </div>
      </div>
    </div>
  );
}
