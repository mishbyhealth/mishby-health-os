import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* -------- Types -------- */
type Metrics = { bmi?: number; energyEstimateKcal?: number };
type Tip = { text?: string; source?: string; pack?: string };
type Hydration = { dailyTargetLiters?: number; reminders?: Array<{ time?: string; note?: string }>; };
type Meal = { time?: string; title?: string; kcal?: number | string; notes?: string };
type MovementItem = { time?: string; title?: string; minutes?: number | string; notes?: string };
type ScheduleItem = { time?: string; title?: string; notes?: string; type?: string };
type Plan = {
  metrics?: Metrics; hydration?: Hydration; movement?: MovementItem[];
  meals?: Meal[]; tips?: Tip[]; schedule?: ScheduleItem[];
  packsApplied?: string[];
};
type Snapshot = { id?: string; version?: string; createdAt?: string; plan?: Plan | null; legacyIds?: string[] };
type PlansMap = Record<string, Snapshot>;
type IdMap = Record<string, string>; // legacyId -> canonicalId

/* -------- Storage keys / regex -------- */
const PLANS_KEY = "glowell:plans";
const IDMAP_KEY = "glowell:plans:idmap";
const CANON = /^PLN-\d{8}-\d{6}-[a-f0-9]{4}$/i;

/* -------- Storage helpers -------- */
function loadPlans(): PlansMap {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as PlansMap;
    if (Array.isArray(parsed)) {
      const m: PlansMap = {};
      for (const s of parsed) if ((s as Snapshot)?.id) m[(s as Snapshot).id!] = s as Snapshot;
      return m;
    }
    return {};
  } catch { return {}; }
}
function savePlans(m: PlansMap) { try { localStorage.setItem(PLANS_KEY, JSON.stringify(m)); } catch {} }
function loadIdMap(): IdMap { try { return JSON.parse(localStorage.getItem(IDMAP_KEY) || "{}"); } catch { return {}; } }
function saveIdMap(m: IdMap) { try { localStorage.setItem(IDMAP_KEY, JSON.stringify(m)); } catch {} }

/* -------- Utils -------- */
function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function derivePackNames(plan?: Plan | null): string[] {
  const set = new Set<string>();
  if (!plan) return [];
  if (Array.isArray(plan.packsApplied)) for (const p of plan.packsApplied) if (p && typeof p === "string") set.add(p);
  if (Array.isArray(plan.tips)) for (const t of plan.tips) { const n=(t?.pack??"").toString().trim(); if(n) set.add(n); }
  return Array.from(set).sort();
}

/* -------- CSV builders -------- */
function csvEscape(v: unknown){const s=v==null?"":String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
function toCSV(h:string[],rows:Array<Array<unknown>>){const head=h.map(csvEscape).join(",");const body=rows.map(r=>r.map(csvEscape).join(",")).join("\n");return `${head}\n${body}\n`;}
function buildScheduleCSV(s?:ScheduleItem[]){return toCSV(["time","title","notes","type"],(s??[]).map(it=>[it.time??"",it.title??"",it.notes??"",it.type??""]));}
function buildHydrationCSV(h?:Hydration){const rows:Array<Array<unknown>>=[];if(!h)return toCSV(["daily_target_liters","reminder_time","reminder_note"],rows);
  if(!h.reminders?.length) rows.push([h.dailyTargetLiters??"","",""]); else for(const r of h.reminders) rows.push([h.dailyTargetLiters??"",r?.time??"",r?.note??""]);
  return toCSV(["daily_target_liters","reminder_time","reminder_note"],rows);
}
function buildMealsCSV(meals?:Meal[]){return toCSV(["time","title","kcal","notes"],(meals??[]).map(m=>[m.time??"",m.title??"",m.kcal??"",m.notes??""]));}

/* -------- ZIP util (no deps) -------- */
type ZipFile={name:string;data:Uint8Array};
const encText=(t:string)=>new TextEncoder().encode(t);
function crc32(buf:Uint8Array){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1));}return ~c>>>0;}
function buildZip(files:ZipFile[]):Blob{
  const te=new TextEncoder();const parts:Uint8Array[]=[];type C={nameBytes:Uint8Array;localHeaderOffset:number;crc:number;size:number};const centr:C[]=[];let off=0;
  for(const f of files){const name=te.encode(f.name);const data=f.data;const crc=crc32(data);const size=data.length;
    const local=new Uint8Array(30+name.length);const dv=new DataView(local.buffer);
    dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);dv.setUint16(6,0,true);dv.setUint16(8,0,true);dv.setUint16(10,0,true);dv.setUint16(12,0,true);
    dv.setUint32(14,crc,true);dv.setUint32(18,size,true);dv.setUint32(22,size,true);dv.setUint16(26,name.length,true);dv.setUint16(28,0,true);local.set(name,30);
    parts.push(local,data);centr.push({nameBytes:name,localHeaderOffset:off,crc,size});off+=local.length+size;}
  const cp:Uint8Array[]=[];let csize=0;
  for(const c of centr){const h=new Uint8Array(46+c.nameBytes.length);const dv=new DataView(h.buffer);
    dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0,true);dv.setUint16(10,0,true);dv.setUint16(12,0,true);dv.setUint16(14,0,true);
    dv.setUint32(16,c.crc,true);dv.setUint32(20,c.size,true);dv.setUint32(24,c.size,true);dv.setUint16(28,c.nameBytes.length,true);dv.setUint16(30,0,true);
    dv.setUint16(32,0,true);dv.setUint16(34,0,true);dv.setUint16(36,0,true);dv.setUint32(38,0,true);dv.setUint32(42,c.localHeaderOffset,true);h.set(c.nameBytes,46);
    cp.push(h);csize+=h.length;}
  const eocd=new Uint8Array(22);const eov=new DataView(eocd.buffer);
  eov.setUint32(0,0x06054b50,true);eov.setUint16(4,0,true);eov.setUint16(6,0,true);eov.setUint16(8,centr.length,true);eov.setUint16(10,centr.length,true);
  eov.setUint32(12,csize,true);eov.setUint32(16,off,true);eov.setUint16(20,0,true);
  const all=[...parts,...cp,eocd];let total=0;for(const p of all) total+=p.length;const out=new Uint8Array(total);let pos=0;for(const p of all){out.set(p,pos);pos+=p.length;}
  return new Blob([out],{type:"application/zip"});
}
function download(blob:Blob, filename:string){
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* -------- Component -------- */
export default function PlansHistory() {
  const navigate = useNavigate();
  const [plansMap, setPlansMap] = useState<PlansMap>({});
  const [idMap, setIdMap] = useState<IdMap>({});
  const [q, setQ] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPlansMap(loadPlans());
    setIdMap(loadIdMap());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PLANS_KEY) setPlansMap(loadPlans());
      if (e.key === IDMAP_KEY) setIdMap(loadIdMap());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close Tools menu on outside click or Esc
  useEffect(() => {
    function onDown(e: KeyboardEvent) { if (e.key === "Escape") setToolsOpen(false); }
    function onClick(e: MouseEvent) {
      if (!toolsRef.current) return;
      if (!toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    }
    if (toolsOpen) {
      document.addEventListener("keydown", onDown);
      document.addEventListener("mousedown", onClick);
      return () => { document.removeEventListener("keydown", onDown); document.removeEventListener("mousedown", onClick); };
    }
  }, [toolsOpen]);

  const rows = useMemo(() => {
    const list = Object.values(plansMap || {}).filter(Boolean) as Snapshot[];
    list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((r) => {
      const packs = derivePackNames(r.plan).join(", ");
      return (
        String(r?.id ?? "").toLowerCase().includes(s) ||
        String(r?.version ?? "").toLowerCase().includes(s) ||
        String(formatDateTime(r?.createdAt)).toLowerCase().includes(s) ||
        String(r?.plan?.metrics?.bmi ?? "").toLowerCase().includes(s) ||
        String(r?.plan?.metrics?.energyEstimateKcal ?? "").toLowerCase().includes(s) ||
        packs.toLowerCase().includes(s)
      );
    });
  }, [plansMap, q]);

  /* -------- Actions -------- */
  function handleOpen(id?: string) { if (!id) return; navigate(`/plans/${id}`); }
  function handleCopyLink(id?: string) { if (!id) return; const url = `${window.location.origin}/plans/${id}`; navigator.clipboard?.writeText(url); alert("Link copied!"); }
  function handleDuplicate(id?: string) {
    if (!id) return;
    const src = plansMap[id]; if (!src) return;

    const t = new Date();
    const stamp = `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,"0")}${String(t.getDate()).padStart(2,"0")}-${String(t.getHours()).padStart(2,"0")}${String(t.getMinutes()).padStart(2,"0")}${String(t.getSeconds()).padStart(2,"0")}`;
    const rand = Math.random().toString(16).slice(2,6);
    const newId = `PLN-${stamp}-${rand}`;

    const copy: Snapshot = {
      ...src,
      id: newId,
      createdAt: new Date().toISOString(),
      legacyIds: [...(src.legacyIds ?? []), src.id!].filter(Boolean),
    };

    const nextPlans = { ...plansMap, [newId]: copy };
    savePlans(nextPlans); setPlansMap(nextPlans);

    const nextIdMap = { ...idMap, [src.id!]: newId };
    saveIdMap(nextIdMap); setIdMap(nextIdMap);

    navigate(`/plans/${newId}`);
  }
  function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm(`Delete plan ${id}?`)) return;
    const next = { ...plansMap }; delete next[id];
    savePlans(next); setPlansMap(next);
  }
  function handleClearAll() {
    if (!confirm("Clear ALL saved plans? (ID map too)")) return;
    localStorage.removeItem(PLANS_KEY);
    localStorage.removeItem(IDMAP_KEY);
    setPlansMap({}); setIdMap({});
  }

  function handleExportAllJSON() {
    const blob = new Blob([JSON.stringify(plansMap ?? {}, null, 2)], { type: "application/json" });
    download(blob, "plans-export.json");
  }
  function handleExportIdMap() {
    const blob = new Blob([JSON.stringify(idMap ?? {}, null, 2)], { type: "application/json" });
    download(blob, "plans-id-map.json");
  }
  async function handleImportAll(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as PlansMap | Snapshot[];
      const current = loadPlans(); let merged: PlansMap = current;
      if (Array.isArray(imported)) { merged = { ...current }; for (const s of imported) if (s?.id) merged[s.id] = s; }
      else if (imported && typeof imported === "object") { merged = { ...current, ...imported }; }
      savePlans(merged); setPlansMap(merged); alert("Imported plans.");
    } catch { alert("Invalid file."); }
    finally { e.currentTarget.value = ""; }
  }
  async function handleImportIdMap(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as IdMap;
      if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error("Invalid map");
      const cur = loadIdMap(); const merged = { ...cur, ...imported };
      saveIdMap(merged); setIdMap(merged);
      alert(`Imported ID map (${Object.keys(imported).length} entries).`);
    } catch { alert("Invalid ID map file."); }
    finally { e.currentTarget.value = ""; }
  }

  /* -------- Migrations (Tools) -------- */
  function migrateFillMissingVersions() {
    let changed = 0;
    const next: PlansMap = { ...plansMap };
    for (const id of Object.keys(next)) {
      const s = next[id]; if (!s) continue;
      if (!s.version || s.version === "—") { s.version = "v6"; changed++; }
    }
    if (changed) { savePlans(next); setPlansMap(next); }
    alert(changed ? `Filled ${changed} item(s) to version v6.` : "No changes needed.");
  }
  function newIdFromCreatedAt(createdAt?: string) {
    const d = createdAt ? new Date(createdAt) : new Date();
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0"), ss = String(d.getSeconds()).padStart(2, "0");
    const rand = Math.random().toString(16).slice(2, 6);
    return `PLN-${y}${m}${day}-${hh}${mm}${ss}-${rand}`;
  }
  function migrateFixIdsSafe() {
    let changed = 0;
    const current = loadPlans();
    const nextPlans: PlansMap = {};
    const nextIdMap: IdMap = { ...loadIdMap() };

    for (const oldId of Object.keys(current)) {
      const snap = current[oldId]; if (!snap) continue;
      if (snap.id && CANON.test(snap.id)) { nextPlans[snap.id] = snap; continue; }
      const newId = newIdFromCreatedAt(snap.createdAt);
      const updated: Snapshot = { ...snap, id: newId, legacyIds: [...(snap.legacyIds ?? []), snap.id!].filter(Boolean) };
      nextPlans[newId] = updated; nextIdMap[oldId] = newId; changed++;
    }
    if (changed) { savePlans(nextPlans); saveIdMap(nextIdMap); setPlansMap(nextPlans); setIdMap(nextIdMap); }
    alert(changed ? `Fixed ${changed} ID(s). Old deep links will redirect.` : "All IDs are already canonical.");
  }

  /* -------- Per-row ZIP export -------- */
  function handleExportZip(id?: string) {
    if (!id) return;
    const snap = plansMap[id]; if (!snap) return;
    const plan = snap.plan ?? {};

    const readme = [
      "GloWell — Export Bundle (Frozen Snapshot)",
      "----------------------------------------",
      `Plan ID: ${snap.id}`,
      `Version: ${snap.version ?? "—"}`,
      `Created: ${formatDateTime(snap.createdAt)}`,
      "",
      "Files included:",
      "• plan.json          → Frozen snapshot (exactly as saved)",
      "• schedule.csv       → Time/Title/Notes/Type rows",
      "• hydration.csv      → Daily target & reminders",
      "• meals.csv          → Time/Title/kcal/Notes",
      "",
      "Note: This is a read-only export of the stored snapshot.",
      "",
    ].join("\n");

    const files: ZipFile[] = [
      { name: "README.txt", data: encText(readme) },
      { name: "plan.json", data: encText(JSON.stringify(snap, null, 2)) },
      { name: "schedule.csv", data: encText(buildScheduleCSV(plan.schedule)) },
      { name: "hydration.csv", data: encText(buildHydrationCSV(plan.hydration)) },
      { name: "meals.csv", data: encText(buildMealsCSV(plan.meals)) },
    ];

    download(buildZip(files), `${snap.id}.zip`);
  }

  /* -------- UI -------- */
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Plans History</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <button className="border rounded px-3 py-1" onClick={() => navigate("/health-plan")} aria-label="Create a new plan">
          + New Plan
        </button>
        <button className="border rounded px-3 py-1" onClick={handleExportAllJSON} aria-label="Export all plans as JSON">
          Export All (JSON)
        </button>
        <label className="border rounded px-3 py-1 cursor-pointer" aria-label="Import plans from JSON">
          Import (JSON)
          <input type="file" accept="application/json" className="hidden" onChange={handleImportAll} aria-label="Choose plans JSON file" />
        </label>
        <button className="border rounded px-3 py-1" onClick={handleClearAll} aria-label="Clear all saved plans and ID map">
          Clear All
        </button>

        <div className="relative" ref={toolsRef}>
          <button
            className="border rounded px-3 py-1"
            onClick={() => setToolsOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={toolsOpen}
            aria-controls="plans-tools-menu"
            aria-label="Open tools menu"
          >
            Tools ▾
          </button>
          {toolsOpen && (
            <div
              id="plans-tools-menu"
              role="menu"
              className="absolute z-10 mt-1 w-64 bg-white border rounded shadow"
            >
              <button role="menuitem" className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={migrateFillMissingVersions} aria-label="Migrate missing versions to v6">
                Migrate: Fill Missing Versions → v6
              </button>
              <button role="menuitem" className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={migrateFixIdsSafe} aria-label="Fix old plan IDs safely">
                Migrate: Fix IDs (safe)
              </button>
              <div className="border-t my-1" />
              <button role="menuitem" className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={handleExportIdMap} aria-label="Export ID map as JSON">
                Export ID Map (JSON)
              </button>
              <label role="menuitem" className="block w-full text-left px-3 py-2 hover:bg-gray-50 cursor-pointer" aria-label="Import ID map from JSON">
                Import ID Map (JSON)
                <input type="file" accept="application/json" className="hidden" onChange={handleImportIdMap} aria-label="Choose ID map JSON file" />
              </label>
            </div>
          )}
        </div>
      </div>

      <input
        className="border rounded px-3 py-2 w-full md:w-1/2"
        placeholder="Search by ID, date/time, version, packs, BMI, kcal…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search plans"
      />

      <div className="overflow-auto">
        <table className="w-full text-sm" role="table" aria-label="Saved plans table">
          <thead>
            <tr className="text-left border-b" role="row">
              <th className="py-2 pr-3" scope="col">Created</th>
              <th className="py-2 pr-3" scope="col">ID</th>
              <th className="py-2 pr-3" scope="col">Version</th>
              <th className="py-2 pr-3" scope="col">Packs</th>
              <th className="py-2 pr-3" scope="col">BMI</th>
              <th className="py-2 pr-3" scope="col">Kcal</th>
              <th className="py-2 pr-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="py-3 opacity-70" colSpan={7}>No plans found.</td></tr>
            ) : (
              rows.map((p, i) => {
                const packs = derivePackNames(p.plan).join(", ");
                const pid = p.id ?? `row-${i}`;
                return (
                  <tr key={pid} className="border-b last:border-b-0" role="row">
                    <td className="py-2 pr-3">{formatDateTime(p.createdAt)}</td>
                    <td className="py-2 pr-3">{p.id ?? "—"}</td>
                    <td className="py-2 pr-3">{p.version ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {packs ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs opacity-80" title={packs} aria-label={`Condition packs applied: ${packs}`}>
                          {packs}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-3">{p.plan?.metrics?.bmi ?? "—"}</td>
                    <td className="py-2 pr-3">{p.plan?.metrics?.energyEstimateKcal ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="border rounded px-2 py-1" onClick={() => handleOpen(p.id)} aria-label={`Open plan ${pid}`}>Open</button>
                        <button className="border rounded px-2 py-1" onClick={() => handleDuplicate(p.id)} aria-label={`Duplicate plan ${pid}`}>Duplicate</button>
                        <button className="border rounded px-2 py-1" onClick={() => handleCopyLink(p.id)} aria-label={`Copy link for plan ${pid}`}>Copy Link</button>
                        <button className="border rounded px-2 py-1" onClick={() => handleExportZip(p.id)} aria-label={`Export ZIP for plan ${pid}`}>Export ZIP</button>
                        <button className="border rounded px-2 py-1" onClick={() => handleDelete(p.id)} aria-label={`Delete plan ${pid}`}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
