import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Try to use the shared ZIP utility if present.
// If its exported API differs, just ping me and paste your src/utils/zip.ts.
let ZipBuilderAny: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ZipBuilderAny = require("@/utils/zip");
} catch (_) {
  // optional; we’ll fallback to a tiny internal Store-Only ZIP if needed
}

/** -------------------------------
 * Types (loose, to match current snapshot shape)
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

type PlanSnapshot = {
  id: string;
  version?: string;
  createdAt?: string; // ISO
  legacyIds?: string[];
  intake?: any;
  plan?: {
    metrics?: Metrics;
    hydration?: Hydration;
    movement?: MovementItem[];
    meals?: Meal[];
    tips?: PlanTip[];
    schedule?: ScheduleItem[];
    packsApplied?: string[]; // optional: names of condition packs (if your HealthPlan added it)
  };
};

type IdMap = Record<string, string>; // legacyId -> canonicalId

/** -------------------------------
 * Local Storage helpers
 * -------------------------------- */
const PLANS_KEY = "glowell:plans";
const IDMAP_KEY = "glowell:plans:idmap";

function loadAllPlans(): Record<string, PlanSnapshot> {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAllPlans(map: Record<string, PlanSnapshot>) {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function loadIdMap(): IdMap {
  try {
    const raw = localStorage.getItem(IDMAP_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveIdMap(map: IdMap) {
  try {
    localStorage.setItem(IDMAP_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** -------------------------------
 * Format helpers
 * -------------------------------- */
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

function csvEscape(val: unknown): string {
  const s = val === undefined || val === null ? "" : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(headers: string[], rows: Array<Array<unknown>>): string {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  return `${head}\n${body}\n`;
}

/** Build the three CSVs from a frozen snapshot */
function buildScheduleCSV(s?: ScheduleItem[]): string {
  const headers = ["time", "title", "notes", "type"];
  const rows = (s ?? []).map(it => [it.time ?? "", it.title ?? "", it.notes ?? "", it.type ?? ""]);
  return toCSV(headers, rows);
}

function buildHydrationCSV(h?: Hydration): string {
  const headers = ["daily_target_liters", "reminder_time", "reminder_note"];
  const rows: Array<Array<unknown>> = [];
  if (!h) return toCSV(headers, rows);
  if (!h.reminders || h.reminders.length === 0) {
    rows.push([h.dailyTargetLiters ?? "", "", ""]);
  } else {
    for (const r of h.reminders) {
      rows.push([h.dailyTargetLiters ?? "", r?.time ?? "", r?.note ?? ""]);
    }
  }
  return toCSV(headers, rows);
}

function buildMealsCSV(meals?: Meal[]): string {
  const headers = ["time", "title", "kcal", "notes"];
  const rows = (meals ?? []).map(m => [m.time ?? "", m.title ?? "", m.kcal ?? "", m.notes ?? ""]);
  return toCSV(headers, rows);
}

/** -------------------------------
 * Minimal store-only ZIP fallback (if utils/zip not available)
 * NOTE: This is a simple, dependency-free ZIP (no compression).
 * If your project already has "@/utils/zip" with a different API,
 * we'll try to use it first.
 * -------------------------------- */
type ZipFile = { name: string; data: Uint8Array };

function textToUint8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// CRC32 for Store method
function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function buildZipFallback(files: ZipFile[]): Blob {
  const encoder = new TextEncoder();

  let fileDataParts: Uint8Array[] = [];
  type Central = {
    nameBytes: Uint8Array;
    localHeaderOffset: number;
    crc: number;
    size: number;
  };
  const centrals: Central[] = [];

  let offset = 0;

  // local file headers + data
  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(localHeader.buffer);

    // Local file header signature
    dv.setUint32(0, 0x04034b50, true);
    // version needed to extract
    dv.setUint16(4, 20, true);
    // general purpose bit flag
    dv.setUint16(6, 0, true);
    // compression method (0 = store)
    dv.setUint16(8, 0, true);
    // file last mod time/date (dummy)
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    // CRC-32
    dv.setUint32(14, crc, true);
    // compressed size
    dv.setUint32(18, size, true);
    // uncompressed size
    dv.setUint32(22, size, true);
    // file name length
    dv.setUint16(26, nameBytes.length, true);
    // extra field length
    dv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    fileDataParts.push(localHeader, f.data);

    centrals.push({
      nameBytes,
      localHeaderOffset: offset,
      crc,
      size,
    });

    offset += localHeader.length + size;
  }

  // central directory
  const centralParts: Uint8Array[] = [];
  let centralSize = 0;
  for (const c of centrals) {
    const h = new Uint8Array(46 + c.nameBytes.length);
    const dv = new DataView(h.buffer);
    dv.setUint32(0, 0x02014b50, true); // central header
    dv.setUint16(4, 20, true); // version made by
    dv.setUint16(6, 20, true); // version needed
    dv.setUint16(8, 0, true);  // flags
    dv.setUint16(10, 0, true); // method store
    dv.setUint16(12, 0, true); // time
    dv.setUint16(14, 0, true); // date
    dv.setUint32(16, c.crc, true); // CRC
    dv.setUint32(20, c.size, true); // comp size
    dv.setUint32(24, c.size, true); // uncomp size
    dv.setUint16(28, c.nameBytes.length, true); // name len
    dv.setUint16(30, 0, true); // extra len
    dv.setUint16(32, 0, true); // comment len
    dv.setUint16(34, 0, true); // disk number
    dv.setUint16(36, 0, true); // internal attrs
    dv.setUint32(38, 0, true); // external attrs
    dv.setUint32(42, c.localHeaderOffset, true); // local header offset
    h.set(c.nameBytes, 46);

    centralParts.push(h);
    centralSize += h.length;
  }

  // end of central directory
  const eocd = new Uint8Array(22);
  const eov = new DataView(eocd.buffer);
  eov.setUint32(0, 0x06054b50, true); // signature
  eov.setUint16(4, 0, true); // disk number
  eov.setUint16(6, 0, true); // disk start
  eov.setUint16(8, centrals.length, true);  // records on disk
  eov.setUint16(10, centrals.length, true); // total records
  eov.setUint32(12, centralSize, true);     // central dir size
  eov.setUint32(16, offset, true);          // central dir offset
  eov.setUint16(20, 0, true);               // comment length

  // concat
  const all = [
    ...fileDataParts,
    ...centralParts,
    eocd,
  ];
  let totalLen = 0;
  for (const p of all) totalLen += p.length;
  const out = new Uint8Array(totalLen);
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

/** -------------------------------
 * Component
 * -------------------------------- */
export default function PlanDetail() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plansMap, setPlansMap] = useState<Record<string, PlanSnapshot>>({});
  const [idMap, setIdMap] = useState<IdMap>({});
  const [snapshot, setSnapshot] = useState<PlanSnapshot | null>(null);
  const [canonicalId, setCanonicalId] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    const pm = loadAllPlans();
    const im = loadIdMap();
    setPlansMap(pm);
    setIdMap(im);

    if (!routeId) return;

    // Resolve legacy → canonical
    let id = routeId;
    if (im[routeId]) {
      id = im[routeId];
      // redirect to canonical (preserve UX)
      navigate(`/plans/${id}`, { replace: true });
    } else {
      // also check any snapshot.legacyIds[]
      const snap = pm[routeId];
      if (!snap) {
        // not found; maybe present with a different id via legacy array?
        for (const [k, v] of Object.entries(pm)) {
          if (v?.legacyIds?.includes(routeId)) {
            id = k;
            // store mapping for future
            const next = { ...im, [routeId]: k };
            saveIdMap(next);
            setIdMap(next);
            navigate(`/plans/${k}`, { replace: true });
            break;
          }
        }
      }
    }

    setCanonicalId(id);
    setSnapshot(pm[id] ?? null);
  }, [routeId, navigate]);

  const title = useMemo(() => {
    if (!snapshot) return "Plan Not Found";
    const dt = formatDateTime(snapshot.createdAt);
    return `Plan ${snapshot.id} (${dt})`;
  }, [snapshot]);

  const packsChip = useMemo(() => {
    const packs = snapshot?.plan?.packsApplied ?? [];
    if (!packs || packs.length === 0) return null;
    return (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs opacity-80">
        Condition Packs applied: {packs.join(", ")}
      </span>
    );
  }, [snapshot]);

  function handleCopyLink() {
    if (!canonicalId) return;
    const url = `${window.location.origin}/plans/${canonicalId}`;
    navigator.clipboard?.writeText(url);
    alert("Link copied!");
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadJSON() {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${snapshot.id}.json`);
  }

  function handleDownloadCSV(kind: "schedule" | "hydration" | "meals") {
    if (!snapshot) return;
    const plan = snapshot.plan ?? {};
    let csv = "";
    let name = `${snapshot.id}-${kind}.csv`;

    if (kind === "schedule") {
      csv = buildScheduleCSV(plan.schedule);
    } else if (kind === "hydration") {
      csv = buildHydrationCSV(plan.hydration);
    } else {
      csv = buildMealsCSV(plan.meals);
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, name);
  }

  function handleDuplicate() {
    if (!snapshot) return;
    const all = { ...plansMap };
    const old = snapshot;

    // lightweight duplicate id (readable)
    const t = new Date();
    const readable = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(
      t.getDate()
    ).padStart(2, "0")}-${String(t.getHours()).padStart(2, "0")}${String(t.getMinutes()).padStart(
      2,
      "0"
    )}${String(t.getSeconds()).padStart(2, "0")}`;
    const newId = `DUP-${readable}`;

    const dup: PlanSnapshot = {
      ...old,
      id: newId,
      createdAt: new Date().toISOString(),
      legacyIds: [...(old.legacyIds ?? []), old.id],
    };

    all[newId] = dup;
    saveAllPlans(all);
    setPlansMap(all);
    navigate(`/plans/${newId}`);
  }

  async function handleExportAllZip() {
    if (!snapshot) return;

    // Build files
    const planJSON = JSON.stringify(snapshot, null, 2);
    const scheduleCSV = buildScheduleCSV(snapshot.plan?.schedule);
    const hydrationCSV = buildHydrationCSV(snapshot.plan?.hydration);
    const mealsCSV = buildMealsCSV(snapshot.plan?.meals);
    const readme = [
      "GloWell — Export Bundle",
      "--------------------------------",
      `Plan ID: ${snapshot.id}`,
      `Version: ${snapshot.version ?? "—"}`,
      `Created: ${formatDateTime(snapshot.createdAt)}`,
      "",
      "Files included:",
      "• plan.json          → Full frozen snapshot",
      "• schedule.csv       → Time/Title/Notes/Type rows",
      "• hydration.csv      → Daily target & reminders",
      "• meals.csv          → Time/Title/kcal/Notes",
      "",
      "Notes:",
      "- This bundle is a frozen view; re-computation is intentionally disabled.",
      "- Import into Plans History via “Import All (JSON)” if needed.",
      "",
      "© GloWell — wellness guidance (non-clinical).",
      "",
    ].join("\n");

    const files = [
      { name: "README.txt", data: textToUint8(readme) },
      { name: "plan.json", data: textToUint8(planJSON) },
      { name: "schedule.csv", data: textToUint8(scheduleCSV) },
      { name: "hydration.csv", data: textToUint8(hydrationCSV) },
      { name: "meals.csv", data: textToUint8(mealsCSV) },
    ];

    // Prefer project ZIP utility if present
    try {
      if (ZipBuilderAny) {
        // Accept either class-style or function-style exports
        if (typeof ZipBuilderAny.ZipBuilder === "function") {
          const zb = new ZipBuilderAny.ZipBuilder();
          for (const f of files) {
            if (zb.addText) zb.addText(f.name, new TextDecoder().decode(f.data));
            else if (zb.addFile) zb.addFile(f.name, f.data);
          }
          const blob: Blob =
            zb.build?.() ??
            zb.finalize?.() ??
            new Blob([], { type: "application/zip" }); // best-effort
          downloadBlob(blob, `${snapshot.id}.zip`);
          return;
        } else if (typeof ZipBuilderAny.buildZip === "function") {
          const blob: Blob = ZipBuilderAny.buildZip(files);
          downloadBlob(blob, `${snapshot.id}.zip`);
          return;
        }
      }
    } catch {
      // fall through to fallback
    }

    // Fallback internal ZIP (store-only)
    const blob = buildZipFallback(files);
    downloadBlob(blob, `${snapshot.id}.zip`);
  }

  if (!snapshot) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Plan not found</h1>
        <p className="opacity-80">The requested plan ID could not be located.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="text-sm opacity-80">
            Version: {snapshot.version ?? "—"} • ID: {snapshot.id}
          </div>
          <div className="mt-2">{packsChip}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="border rounded px-3 py-1" onClick={handleDownloadJSON}>
            JSON
          </button>
          <button className="border rounded px-3 py-1" onClick={() => handleDownloadCSV("schedule")}>
            Schedule CSV
          </button>
          <button className="border rounded px-3 py-1" onClick={() => handleDownloadCSV("hydration")}>
            Hydration CSV
          </button>
          <button className="border rounded px-3 py-1" onClick={() => handleDownloadCSV("meals")}>
            Meals CSV
          </button>
          <button className="border rounded px-3 py-1" onClick={handleExportAllZip}>
            Export All (ZIP)
          </button>
          <button className="border rounded px-3 py-1" onClick={handleCopyLink}>
            Copy Link
          </button>
          <button className="border rounded px-3 py-1" onClick={handlePrint}>
            Print
          </button>
          <button className="border rounded px-3 py-1" onClick={handleDuplicate}>
            Duplicate
          </button>
        </div>
      </div>

      {/* Frozen view summary */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Metrics</h2>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="opacity-70">BMI</dt>
            <dd>{snapshot.plan?.metrics?.bmi ?? "—"}</dd>
            <dt className="opacity-70">Energy (kcal)</dt>
            <dd>{snapshot.plan?.metrics?.energyEstimateKcal ?? "—"}</dd>
          </dl>
        </div>

        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Hydration</h2>
          <div className="text-sm">
            Daily target: {snapshot.plan?.hydration?.dailyTargetLiters ?? "—"} L
          </div>
          <ul className="mt-2 list-disc list-inside text-sm">
            {(snapshot.plan?.hydration?.reminders ?? []).map((r, i) => (
              <li key={i}>
                {r?.time ?? "—"} — {r?.note ?? ""}
              </li>
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
              {(snapshot.plan?.meals ?? []).map((m, idx) => (
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
              {(snapshot.plan?.schedule ?? []).map((s, idx) => (
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
          {(snapshot.plan?.tips ?? []).map((t, i) => (
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
