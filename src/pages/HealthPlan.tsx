import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * HealthPlan (v7 + Step 2 hardening)
 * - Renders the computed plan (metrics, hydration, movement, meals, tips, schedule).
 * - Auto-saves ONCE per unique {intake, plan, version} using a stable SHA-256 signature.
 * - Maintains a cross-session index in localStorage: glowell:plans:index = { signature: planId }.
 * - If an identical plan already exists, we DO NOT save again; instead we surface the existing ID & createdAt.
 * - Exports: JSON, Schedule CSV, Hydration CSV, Meals CSV, Export All (ZIP).
 * - Shows "Condition Packs applied: ..." chip if plan.packsApplied[] present.
 *
 * NOTES:
 * - This file assumes your engine has already produced `currentIntake` and `currentPlan` in-memory
 *   right before rendering this page (your existing v7 behavior).
 *   If your app puts these into a context or localStorage, adapt the two getters below.
 */

/* --------------------------------
 * Types (loose, to match v7 shape)
 * -------------------------------- */
type PlanTip = { text: string; source?: string; pack?: string };
type Hydration = {
  dailyTargetLiters?: number;
  reminders?: Array<{ time?: string; note?: string }>;
};
type Meal = { time?: string; title?: string; kcal?: number | string; notes?: string };
type MovementItem = { time?: string; title?: string; minutes?: number | string; notes?: string };
type ScheduleItem = { time?: string; title?: string; notes?: string; type?: string };
type Metrics = { bmi?: number; energyEstimateKcal?: number };
type Plan = {
  metrics?: Metrics;
  hydration?: Hydration;
  movement?: MovementItem[];
  meals?: Meal[];
  tips?: PlanTip[];
  schedule?: ScheduleItem[];
  packsApplied?: string[]; // from Step 3 (optional)
};

type Snapshot = {
  id: string;
  version: string; // e.g., "v6" / "v7"
  createdAt: string; // ISO
  intake: any;
  plan: Plan;
  legacyIds?: string[];
};

type PlansMap = Record<string, Snapshot>;
type IdMap = Record<string, string>; // legacyId -> canonicalId
type IndexMap = Record<string, string>; // signature -> planId

/* --------------------------------
 * Storage keys (v7 compatible)
 * -------------------------------- */
const PLANS_KEY = "glowell:plans";
const IDMAP_KEY = "glowell:plans:idmap";
const INDEX_KEY = "glowell:plans:index";

/* --------------------------------
 * Helpers: storage
 * -------------------------------- */
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
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

/* --------------------------------
 * Stable stringify (order keys)
 * -------------------------------- */
function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`);
  return `{${parts.join(",")}}`;
}

/* --------------------------------
 * SHA-256 signature (hex)
 * -------------------------------- */
async function sha256Hex(text: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback poor-man hash (still stable) if SubtleCrypto unavailable
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }
}

/* --------------------------------
 * CSV helpers
 * -------------------------------- */
function csvEscape(val: unknown): string {
  const s = val === undefined || val === null ? "" : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCSV(headers: string[], rows: Array<Array<unknown>>): string {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return `${head}\n${body}\n`;
}
function buildScheduleCSV(s?: ScheduleItem[]): string {
  const headers = ["time", "title", "notes", "type"];
  const rows = (s ?? []).map((it) => [it.time ?? "", it.title ?? "", it.notes ?? "", it.type ?? ""]);
  return toCSV(headers, rows);
}
function buildHydrationCSV(h?: Hydration): string {
  const headers = ["daily_target_liters", "reminder_time", "reminder_note"];
  const rows: Array<Array<unknown>> = [];
  if (!h) return toCSV(headers, rows);
  if (!h.reminders || h.reminders.length === 0) {
    rows.push([h.dailyTargetLiters ?? "", "", ""]);
  } else {
    for (const r of h.reminders) rows.push([h.dailyTargetLiters ?? "", r?.time ?? "", r?.note ?? ""]);
  }
  return toCSV(headers, rows);
}
function buildMealsCSV(meals?: Meal[]): string {
  const headers = ["time", "title", "kcal", "notes"];
  const rows = (meals ?? []).map((m) => [m.time ?? "", m.title ?? "", m.kcal ?? "", m.notes ?? ""]);
  return toCSV(headers, rows);
}

/* --------------------------------
 * ZIP utility (prefer project util, else minimal fallback)
 * -------------------------------- */
let ZipUtil: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ZipUtil = require("@/utils/zip");
} catch {
  // no-op; we’ll fallback to an internal store-only ZIP
}

type ZipFile = { name: string; data: Uint8Array };
function textToUint8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
// Minimal store-only ZIP (same as PlanDetail fallback)
function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function buildZipFallback(files: ZipFile[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  type Central = { nameBytes: Uint8Array; localHeaderOffset: number; crc: number; size: number };
  const centrals: Central[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, size, true);
    dv.setUint32(22, size, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    parts.push(local, data);
    centrals.push({ nameBytes, localHeaderOffset: offset, crc, size });
    offset += local.length + size;
  }

  const centralsParts: Uint8Array[] = [];
  let centralSize = 0;
  for (const c of centrals) {
    const h = new Uint8Array(46 + c.nameBytes.length);
    const dv = new DataView(h.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint16(14, 0, true);
    dv.setUint32(16, c.crc, true);
    dv.setUint32(20, c.size, true);
    dv.setUint32(24, c.size, true);
    dv.setUint16(28, c.nameBytes.length, true);
    dv.setUint16(30, 0, true);
    dv.setUint16(32, 0, true);
    dv.setUint16(34, 0, true);
    dv.setUint16(36, 0, true);
    dv.setUint32(38, 0, true);
    dv.setUint32(42, c.localHeaderOffset, true);
    h.set(c.nameBytes, 46);

    centralsParts.push(h);
    centralSize += h.length;
  }

  const eocd = new Uint8Array(22);
  const eov = new DataView(eocd.buffer);
  eov.setUint32(0, 0x06054b50, true);
  eov.setUint16(4, 0, true);
  eov.setUint16(6, 0, true);
  eov.setUint16(8, centrals.length, true);
  eov.setUint16(10, centrals.length, true);
  eov.setUint32(12, centralSize, true);
  eov.setUint32(16, offset, true);
  eov.setUint16(20, 0, true);

  const all = [...parts, ...centralsParts, eocd];
  let total = 0;
  for (const p of all) total += p.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of all) {
    out.set(p, pos);
    pos += p.length;
  }
  return new Blob([out], { type: "application/zip" });
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* --------------------------------
 * App-specific getters (adapt if needed)
 * --------------------------------
 * These two functions should return the current intake and the computed plan
 * that your engine produced just before rendering this page.
 * If your app already has them in context/state, replace these with the real hooks.
 */
function getCurrentIntake(): any {
  // TRY sessionStorage first (more ephemeral), then localStorage
  const session = sessionStorage.getItem("glowell:intake:current");
  if (session) try { return JSON.parse(session); } catch {}
  const local = localStorage.getItem("glowell:intake:current");
  if (local) try { return JSON.parse(local); } catch {}
  return {};
}
function getCurrentPlan(): Plan {
  const session = sessionStorage.getItem("glowell:plan:current");
  if (session) try { return JSON.parse(session); } catch {}
  const local = localStorage.getItem("glowell:plan:current");
  if (local) try { return JSON.parse(local); } catch {}
  // If your engine attaches packs/tips, leave empty as fallback.
  return { metrics: {}, hydration: { dailyTargetLiters: undefined, reminders: [] }, meals: [], tips: [], schedule: [] };
}

/* --------------------------------
 * Component
 * -------------------------------- */
export default function HealthPlan() {
  const navigate = useNavigate();

  const version = "v7"; // label for snapshots created by this page
  const intake = useMemo(() => getCurrentIntake(), []);
  const plan: Plan = useMemo(() => getCurrentPlan(), []);

  const [plansMap, setPlansMap] = useState<PlansMap>(() => loadJSON<PlansMap>(PLANS_KEY, {}));
  const [indexMap, setIndexMap] = useState<IndexMap>(() => loadJSON<IndexMap>(INDEX_KEY, {}));
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [existingInfo, setExistingInfo] = useState<{ id: string; createdAt: string } | null>(null);
  const savedRef = useRef(false); // one-time per mount (guards auto-save repeat)

  const signatureInput = useMemo(() => ({ intake, plan, version }), [intake, plan, version]);

  useEffect(() => {
    (async () => {
      if (savedRef.current) return; // only once per mount
      savedRef.current = true;

      // 1) Build stable signature
      const sig = await sha256Hex(stableStringify(signatureInput));

      // 2) If signature already seen → DO NOT save; surface the existing ID
      const existingId = indexMap[sig];
      if (existingId && plansMap[existingId]) {
        setExistingInfo({ id: existingId, createdAt: plansMap[existingId].createdAt });
        return;
      }

      // 3) Create NEW snapshot ID (readable PLN-YYYYMMDD-HHMMSS-xxxx)
      const t = new Date();
      const stamp =
        `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}-` +
        `${String(t.getHours()).padStart(2, "0")}${String(t.getMinutes()).padStart(2, "0")}${String(t.getSeconds()).padStart(2, "0")}`;
      const rand = Math.random().toString(16).slice(2, 6);
      const id = `PLN-${stamp}-${rand}`;

      const snapshot: Snapshot = {
        id,
        version,
        createdAt: new Date().toISOString(),
        intake,
        plan,
      };

      // 4) Persist snapshot + index
      const nextPlans = { ...plansMap, [id]: snapshot };
      const nextIndex = { ...indexMap, [sig]: id };
      saveJSON(PLANS_KEY, nextPlans);
      saveJSON(INDEX_KEY, nextIndex);
      setPlansMap(nextPlans);
      setIndexMap(nextIndex);
      setJustSavedId(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureInput]);

  const lastSavedRender = useMemo(() => {
    if (existingInfo) {
      return (
        <div className="rounded border px-3 py-2 bg-white/60">
          <div className="text-sm">
            <strong>Already saved</strong> • ID: {existingInfo.id} • Created: {formatDateTime(existingInfo.createdAt)}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="border rounded px-3 py-1" onClick={() => navigate(`/plans/${existingInfo.id}`)}>
              Open Existing Plan
            </button>
            <button
              className="border rounded px-3 py-1"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/plans/${existingInfo.id}`);
                alert("Link copied!");
              }}
            >
              Copy Link
            </button>
          </div>
        </div>
      );
    }
    if (justSavedId) {
      const dt = formatDateTime(plansMap[justSavedId]?.createdAt);
      return (
        <div className="rounded border px-3 py-2 bg-white/60">
          <div className="text-sm">
            <strong>Last saved</strong> • {dt} • ID: {justSavedId}
          </div>
          <div className="mt-2">
            <button className="border rounded px-3 py-1" onClick={() => navigate(`/plans/${justSavedId}`)}>
              Open Just-Saved Plan
            </button>
          </div>
        </div>
      );
    }
    return null;
  }, [existingInfo, justSavedId, plansMap, navigate]);

  /* ---------- Exports (JSON/CSV/ZIP) ---------- */
  function handleDownloadJSON() {
    const tmp: Snapshot = {
      id: justSavedId ?? "PLAN",
      version,
      createdAt: new Date().toISOString(),
      intake,
      plan,
    };
    const blob = new Blob([JSON.stringify(tmp, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${tmp.id}.json`);
  }
  function handleDownloadCSV(kind: "schedule" | "hydration" | "meals") {
    let csv = "";
    let name = `${justSavedId ?? "PLAN"}-${kind}.csv`;
    if (kind === "schedule") csv = buildScheduleCSV(plan.schedule);
    else if (kind === "hydration") csv = buildHydrationCSV(plan.hydration);
    else csv = buildMealsCSV(plan.meals);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, name);
  }
  function handleExportAllZip() {
    const base = justSavedId ?? "PLAN";
    const readme = [
      "GloWell — Export Bundle",
      "--------------------------------",
      `Plan ID: ${base}`,
      `Version: ${version}`,
      `Created: ${formatDateTime(new Date().toISOString())}`,
      "",
      "Files included:",
      "• plan.json          → Current view of intake+plan",
      "• schedule.csv       → Time/Title/Notes/Type rows",
      "• hydration.csv      → Daily target & reminders",
      "• meals.csv          → Time/Title/kcal/Notes",
      "",
      "Note: The canonical frozen snapshot lives in Plans History.",
      "",
    ].join("\n");

    const files: ZipFile[] = [
      { name: "README.txt", data: textToUint8(readme) },
      { name: "plan.json", data: textToUint8(JSON.stringify({ id: base, version, intake, plan }, null, 2)) },
      { name: "schedule.csv", data: textToUint8(buildScheduleCSV(plan.schedule)) },
      { name: "hydration.csv", data: textToUint8(buildHydrationCSV(plan.hydration)) },
      { name: "meals.csv", data: textToUint8(buildMealsCSV(plan.meals)) },
    ];

    try {
      if (ZipUtil) {
        if (typeof ZipUtil.ZipBuilder === "function") {
          const zb = new ZipUtil.ZipBuilder();
          for (const f of files) {
            if (zb.addText) zb.addText(f.name, new TextDecoder().decode(f.data));
            else if (zb.addFile) zb.addFile(f.name, f.data);
          }
          const blob: Blob = zb.build?.() ?? zb.finalize?.();
          if (blob) { downloadBlob(blob, `${base}.zip`); return; }
        } else if (typeof ZipUtil.buildZip === "function") {
          const blob: Blob = ZipUtil.buildZip(files);
          downloadBlob(blob, `${base}.zip`);
          return;
        }
      }
    } catch {
      // fall through
    }
    const blob = buildZipFallback(files);
    downloadBlob(blob, `${base}.zip`);
  }

  /* ---------- UI ---------- */
  const packsChip = useMemo(() => {
    const packs = plan.packsApplied ?? [];
    if (!packs || packs.length === 0) return null;
    return (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs opacity-80">
        Condition Packs applied: {packs.join(", ")}
      </span>
    );
  }, [plan.packsApplied]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Your Health Plan</h1>
          <div className="mt-2">{packsChip}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="border rounded px-3 py-1" onClick={handleDownloadJSON}>JSON</button>
          <button className="border rounded px-3 py-1" onClick={() => handleDownloadCSV("schedule")}>Schedule CSV</button>
          <button className="border rounded px-3 py-1" onClick={() => handleDownloadCSV("hydration")}>Hydration CSV</button>
          <button className="border rounded px-3 py-1" onClick={() => handleDownloadCSV("meals")}>Meals CSV</button>
          <button className="border rounded px-3 py-1" onClick={handleExportAllZip}>Export All (ZIP)</button>
        </div>
      </div>

      {lastSavedRender}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Metrics</h2>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="opacity-70">BMI</dt>
            <dd>{plan.metrics?.bmi ?? "—"}</dd>
            <dt className="opacity-70">Energy (kcal)</dt>
            <dd>{plan.metrics?.energyEstimateKcal ?? "—"}</dd>
          </dl>
        </div>

        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Hydration</h2>
          <div className="text-sm">
            Daily target: {plan.hydration?.dailyTargetLiters ?? "—"} L
          </div>
          <ul className="mt-2 list-disc list-inside text-sm">
            {(plan.hydration?.reminders ?? []).map((r, i) => (
              <li key={i}>{r?.time ?? "—"} — {r?.note ?? ""}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Meals</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-1 pr-2">Time</th>
                <th className="py-1 pr-2">Title</th>
                <th className="py-1 pr-2">kcal</th>
                <th className="py-1 pr-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(plan.meals ?? []).map((m, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="py-1 pr-2">{m.time ?? "—"}</td>
                  <td className="py-1 pr-2">{m.title ?? "—"}</td>
                  <td className="py-1 pr-2">{m.kcal ?? "—"}</td>
                  <td className="py-1 pr-2">{m.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Schedule</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-1 pr-2">Time</th>
                <th className="py-1 pr-2">Title</th>
                <th className="py-1 pr-2">Type</th>
                <th className="py-1 pr-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(plan.schedule ?? []).map((s, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  <td className="py-1 pr-2">{s.time ?? "—"}</td>
                  <td className="py-1 pr-2">{s.title ?? "—"}</td>
                  <td className="py-1 pr-2">{s.type ?? "—"}</td>
                  <td className="py-1 pr-2">{s.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Tips</h2>
        <ul className="list-disc list-inside text-sm">
          {(plan.tips ?? []).map((t, i) => (
            <li key={i}>
              {t.text}{" "}
              <span className="opacity-60">
                {t.pack ? `(${t.pack})` : t.source ? `(${t.source})` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
