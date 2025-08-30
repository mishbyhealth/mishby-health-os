// File: src/pages/PlansHistoryV2.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LS_PLAN_KEY = "glowell:plan_v2";
const LS_INTAKE_KEY = "glowell:intake_v2";
const LS_HISTORY_KEY = "glowell:plan_history_v2";

type HistItem = { id: number; title?: string; intake?: any; plan?: any; tags?: string[] };

function safeLoadHistory(): HistItem[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function safeSaveHistory(list: HistItem[]) {
  try { localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(list)); } catch {}
}

export default function PlansHistoryV2() {
  const nav = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<HistItem[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tagFilter, setTagFilter] = useState<string>(""); // active tag chip
  const [err, setErr] = useState<string | null>(null);

  // Initial load + read ?tag= from URL
  useEffect(() => {
    try {
      setItems(safeLoadHistory());
    } catch {
      setErr("Could not read history.");
      setItems([]);
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = (params.get("tag") || "").trim();
    if (t) setTagFilter(t);
  }, [location.search]);

  // Tag frequency (max 20)
  const tagStats = useMemo(() => {
    const freq = new Map<string, number>();
    for (const it of items) {
      const tlist: string[] = (it.tags || it.intake?.meta?.tags || []).filter(Boolean);
      for (const t of tlist) {
        const key = String(t).trim();
        if (!key) continue;
        freq.set(key, (freq.get(key) || 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .slice(0, 20);
  }, [items]);

  // Filtering
  const filtered = useMemo(() => {
    try {
      const q = search.trim().toLowerCase();
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (to) to.setHours(23, 59, 59, 999);
      const tagq = tagFilter.trim().toLowerCase();

      return items.filter((it) => {
        if (tagq) {
          const tags: string[] = (it.tags || it.intake?.meta?.tags || []).map((s) => String(s).toLowerCase());
          if (!tags.includes(tagq)) return false;
        }
        let matchText = true;
        if (q) {
          const hay =
            (it.title || "") +
            " " +
            (it.tags || []).join(" ") +
            " " +
            JSON.stringify(it.plan || {}) +
            " " +
            JSON.stringify(it.intake || {});
          matchText = hay.toLowerCase().includes(q);
        }
        let matchDate = true;
        const d = new Date(it.id);
        if (from && d < from) matchDate = false;
        if (to && d > to) matchDate = false;
        return matchText && matchDate;
      });
    } catch {
      return items;
    }
  }, [items, search, dateFrom, dateTo, tagFilter]);

  function view(item: HistItem) {
    try {
      if (item.plan) localStorage.setItem(LS_PLAN_KEY, JSON.stringify(item.plan));
      if (item.intake) localStorage.setItem(LS_INTAKE_KEY, JSON.stringify(item.intake));
    } catch {}
    nav("/health-form-v2");
  }
  function edit(item: HistItem) {
    try {
      if (item.intake) localStorage.setItem(LS_INTAKE_KEY, JSON.stringify(item.intake));
      localStorage.removeItem(LS_PLAN_KEY);
    } catch {}
    nav("/health-form-v2");
  }
  function remove(id: number) {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    safeSaveHistory(next);
  }
  function clearAll() {
    if (!confirm("Clear entire history?")) return;
    setItems([]);
    safeSaveHistory([]);
  }

  async function handlePDF(item: HistItem) {
    try {
      const { savePlanPDF } = await import("@/../mho2/plugins/exporters/pdf");
      await savePlanPDF(item.plan, "WellnessPlanV2.pdf");
    } catch { alert("PDF export module not available."); }
  }
  async function handleWhatsApp(item: HistItem) {
    try {
      const { shareOnWhatsApp } = await import("@/../mho2/plugins/exporters/whatsapp");
      shareOnWhatsApp(item.plan);
    } catch { alert("WhatsApp share module not available."); }
  }
  async function handleCopy(item: HistItem) {
    try {
      const { copyShareText } = await import("@/../mho2/plugins/exporters/whatsapp");
      await copyShareText(item.plan);
    } catch { alert("Copy helper not available."); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Plan History — V2</h1>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={clearAll}>
              Clear All
            </button>
          )}
          <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => setItems(safeLoadHistory())}>
            Refresh
          </button>
        </div>
      </header>

      {/* Quick Tag Filter Row */}
      {tagStats.length > 0 && (
        <div className="mb-4 flex items-center flex-wrap gap-2">
          <span className="text-xs text-gray-600 mr-1">Quick tags:</span>
          {tagStats.map(([t, n]) => {
            const active = tagFilter.toLowerCase() === t.toLowerCase();
            return (
              <button
                key={t}
                className={
                  "text-xs px-2 py-1 rounded-full border " +
                  (active
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100")
                }
                onClick={() => {
                  const next = active ? "" : t;
                  setTagFilter(next);
                  // sync to URL param
                  const url = new URL(window.location.href);
                  if (next) url.searchParams.set("tag", next);
                  else url.searchParams.delete("tag");
                  window.history.replaceState({}, "", url.toString());
                }}
                title={`${n} entr${n === 1 ? "y" : "ies"}`}
              >
                #{t} {n > 1 ? `(${n})` : ""}
              </button>
            );
          })}
          {tagFilter && (
            <button className="ml-2 text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={() => {
              setTagFilter("");
              const url = new URL(window.location.href);
              url.searchParams.delete("tag");
              window.history.replaceState({}, "", url.toString());
            }}>
              Clear tag filter
            </button>
          )}
        </div>
      )}

      {/* Search + date filters */}
      <div className="mb-6 grid md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Search (title, tag, meals, movement…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg w-full"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border rounded-lg w-full"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border rounded-lg w-full"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-4 border rounded bg-white">No matching history found.</div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => {
            const ts = new Date(it.id).toLocaleString();
            const d = it.plan?.day || {};
            const preview =
              (d?.meals?.[0]?.ideas?.slice?.(0, 2)?.join(", ")) ||
              (d?.movement?.blocks?.[0]) ||
              (d?.hydration?.schedule?.slice?.(0, 2)?.join(", ")) ||
              "—";
            const tags = (it.tags || it.intake?.meta?.tags || []) as string[];

            return (
              <li key={it.id} className="p-4 rounded-lg border bg-white flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{it.title || `Plan • ${ts}`}</div>
                  {tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {tags.map((t, i) => {
                        const active = tagFilter.toLowerCase() === String(t).toLowerCase();
                        return (
                          <button
                            key={i}
                            className={
                              "text-xs px-2 py-1 rounded-full border " +
                              (active
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100")
                            }
                            onClick={() => {
                              const next = active ? "" : String(t);
                              setTagFilter(next);
                              const url = new URL(window.location.href);
                              if (next) url.searchParams.set("tag", next);
                              else url.searchParams.delete("tag");
                              window.history.replaceState({}, "", url.toString());
                            }}
                            title="Filter by this tag"
                          >
                            #{t}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-1">
                    Wake: {d?.wake || "-"} • Sleep: {d?.sleep || "-"} • Preview: {preview}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={() => view(it)}>View</button>
                  <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={() => edit(it)}>Re-Edit</button>
                  <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={() => handlePDF(it)}>PDF</button>
                  <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={() => handleWhatsApp(it)}>WhatsApp</button>
                  <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={() => handleCopy(it)}>Copy</button>
                  <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={() => remove(it.id)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
