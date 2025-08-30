// src/pages/PlansHistory.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/** v9 keys: glowell:plan_history_v2 (array), glowell:plan_v2 (current) */
const LS_HISTORY_KEY = "glowell:plan_history_v2";
const LS_CURRENT_KEY = "glowell:plan_v2";

type Any = any;

function readHistory(): Any[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
  } catch {}
  // fallback: if only a single plan exists, show it as a "history of one"
  try {
    const one = localStorage.getItem(LS_CURRENT_KEY);
    if (one) return [JSON.parse(one)];
  } catch {}
  return [];
}

export default function PlansHistory() {
  const nav = useNavigate();
  const [history, setHistory] = useState<Any[]>([]);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  // Collect top tags from meals[].tags (if present)
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of history) {
      const meals = p?.day?.meals || [];
      for (const m of meals) {
        const tags: string[] = Array.isArray(m?.tags) ? m.tags : [];
        for (const t of tags) counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);
  }, [history]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return history.filter((p) => {
      // date window
      const when = p?.meta?.generatedAtISO ? new Date(p.meta.generatedAtISO) : null;
      if (from && when && when < from) return false;
      if (to && when && when > to) return false;

      // tag filter
      if (selectedTag) {
        const meals = p?.day?.meals || [];
        const has = meals.some((m: Any) =>
          Array.isArray(m?.tags) && m.tags.includes(selectedTag)
        );
        if (!has) return false;
      }

      // text search across a compact string
      if (qn) {
        const str = JSON.stringify(
          {
            meta: p?.meta,
            day: {
              hydration: p?.day?.hydration,
              meals: (p?.day?.meals || []).map((m: Any) => ({
                label: m?.label,
                ideas: m?.ideas,
                tags: m?.tags,
              })),
              movement: p?.day?.movement,
              mind: p?.day?.mind,
            },
          },
          null,
          0
        ).toLowerCase();
        if (!str.includes(qn)) return false;
      }
      return true;
    });
  }, [history, q, dateFrom, dateTo, selectedTag]);

  function openAsCurrent(p: Any) {
    try {
      localStorage.setItem(LS_CURRENT_KEY, JSON.stringify(p));
    } catch {}
    nav("/health-plan");
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-900">Plans History</h1>
          <p className="text-gray-600 mt-1">
            Browse your saved non-clinical wellness plans; filter by date, search text, or tags.
          </p>
        </header>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-700">Search</label>
              <input
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., breakfast, hydration, walk"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">From</label>
              <input
                type="date"
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">To</label>
              <input
                type="date"
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Tag chips */}
          {topTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag((s) => (s === t ? "" : t))}
                  className={
                    "px-3 py-1 rounded-full border text-sm " +
                    (selectedTag === t
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-gray-300 hover:bg-gray-50")
                  }
                >
                  #{t}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag("")}
                  className="px-3 py-1 rounded-full border text-sm border-gray-300 hover:bg-gray-50"
                >
                  Clear tag
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-6 text-gray-600">
              No saved plans yet. Generate a plan from <b>New Plan</b>, it will appear here.
            </div>
          ) : (
            filtered.map((p, idx) => {
              const when = p?.meta?.generatedAtISO
                ? new Date(p.meta.generatedAtISO).toLocaleString()
                : "Unknown";
              const tags =
                (p?.day?.meals || [])
                  .flatMap((m: Any) => (Array.isArray(m?.tags) ? m.tags : []))
                  .slice(0, 5) || [];
              return (
                <div
                  key={idx}
                  className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-emerald-900">Plan #{idx + 1}</div>
                      <div className="text-xs text-gray-500">{when}</div>
                      {tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tags.map((t: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full border text-xs">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded border"
                        onClick={() => openAsCurrent(p)}
                        title="Open as current plan"
                      >
                        View
                      </button>
                      <button
                        className="px-3 py-1 rounded border"
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(JSON.stringify(p, null, 2));
                            alert("Plan JSON copied");
                          } catch {}
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
