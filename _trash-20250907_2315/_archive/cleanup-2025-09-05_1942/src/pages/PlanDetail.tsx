import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/** PlanDetail (v7.1) — adds Packs chip + keeps ZIP export, duplicate, legacy ID map */

type Tip = { text?: string; source?: string; pack?: string };
type Hydration = { dailyTargetLiters?: number; reminders?: Array<{ time?: string; note?: string }>; };
type Meal = { time?: string; title?: string; kcal?: number | string; notes?: string };
type MovementItem = { time?: string; title?: string; minutes?: number | string; notes?: string };
type ScheduleItem = { time?: string; title?: string; notes?: string; type?: string };
type Metrics = { bmi?: number; energyEstimateKcal?: number };
type Plan = {
  metrics?: Metrics; hydration?: Hydration; movement?: MovementItem[];
  meals?: Meal[]; tips?: Tip[]; schedule?: ScheduleItem[]; packsApplied?: string[];
};
type Snapshot = { id: string; version?: string; createdAt?: string; intake?: any; plan?: Plan; legacyIds?: string[]; };
type PlansMap = Record<string, Snapshot>;
type IdMap = Record<string, string>;

const PLANS_KEY = "glowell:plans";
const IDMAP_KEY = "glowell:plans:idmap";

function loadJSON<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function saveJSON<T>(key: string, value: T) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function formatDateTime(iso?: string) {
  if (!iso) return "—"; const d = new Date(iso);
  const pad=(n:number)=>String(n).padStart(2,"0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* CSV builders */
function csvEscape(v: unknown){const s=v==null?"":String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
function toCSV(h:string[],rows:Array<Array<unknown>>){const head=h.map(csvEscape).join(",");const body=rows.map(r=>r.map(csvEscape).join(",")).join("\n");return `${head}\n${body}\n`;}
function buildScheduleCSV(s?:ScheduleItem[]){return toCSV(["time","title","notes","type"],(s??[]).map(it=>[it.time??"",it.title??"",it.notes??"",it.type??""]));}
function buildHydrationCSV(h?:Hydration){const rows:Array<Array<unknown>>=[];if(!h)return toCSV(["daily_target_liters","reminder_time","reminder_note"],rows);
  if(!h.reminders?.length) rows.push([h.dailyTargetLiters??"","",""]); else for(const r of h.reminders) rows.push([h.dailyTargetLiters??"",r?.time??"",r?.note??""]);
  return toCSV(["daily_target_liters","reminder_time","reminder_note"],rows);
}
function buildMealsCSV(meals?:Meal[]){return toCSV(["time","title","kcal","notes"],(meals??[]).map(m=>[m.time??"",m.title??"",m.kcal??"",m.notes??""]));}

/* ZIP util or fallback */
let ZipUtil:any=null; try{ZipUtil=require("@/utils/zip");}catch{}
type ZipFile={name:string;data:Uint8Array};
const textToUint8=(t:string)=>new TextEncoder().encode(t);
function crc32(buf:Uint8Array){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1));}return ~c>>>0;}
function buildZipFallback(files:ZipFile[]):Blob{
  const enc=new TextEncoder();const parts:Uint8Array[]=[];type C={nameBytes:Uint8Array;localHeaderOffset:number;crc:number;size:number};const centr:C[]=[];let off=0;
  for(const f of files){const name=enc.encode(f.name);const data=f.data;const crc=crc32(data);const size=data.length;
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
function downloadBlob(blob:Blob, filename:string){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}

/* packs: derive names from tips + packsApplied (safe) */
function derivePackNames(plan: Plan | undefined): string[] {
  const set = new Set<string>();
  if (!plan) return [];
  if (Array.isArray(plan.packsApplied)) for (const p of plan.packsApplied) if (p && typeof p === "string") set.add(p);
  if (Array.isArray(plan.tips)) for (const t of plan.tips) { const n=(t?.pack??"").toString().trim(); if(n) set.add(n); }
  return Array.from(set).sort();
}

export default function PlanDetail() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [plansMap, setPlansMap] = useState<PlansMap>(() => loadJSON<PlansMap>(PLANS_KEY, {}));
  const [idMap] = useState<IdMap>(() => loadJSON<IdMap>(IDMAP_KEY, {}));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!routeId) return;
    const mapped = idMap[routeId];
    if (mapped && mapped !== routeId) { navigate(`/plans/${mapped}`, { replace: true }); return; }
    const target = plansMap[routeId] ? routeId :
      Object.values(plansMap).find(s => (s?.legacyIds ?? []).includes(routeId))?.id;
    if (target && target !== routeId) {
      const merged = { ...idMap, [routeId]: target }; saveJSON(IDMAP_KEY, merged);
      navigate(`/plans/${target}`, { replace: true }); return;
    }
    if (!plansMap[routeId]) setNotFound(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const snap = useMemo<Snapshot | null>(() => routeId ? (plansMap[routeId] ?? null) : null, [plansMap, routeId]);
  const plan = snap?.plan ?? {};
  const packNames = useMemo(() => derivePackNames(plan), [plan]);

  function copyLink(){ if(!snap) return; const url=`${window.location.origin}/plans/${snap.id}`; navigator.clipboard?.writeText(url); alert("Link copied!"); }
  function printPage(){ window.print(); }
  function downloadJSON(){ if(!snap) return; downloadBlob(new Blob([JSON.stringify(snap,null,2)],{type:"application/json"}), `${snap.id}.json`); }
  function downloadCSV(kind:"schedule"|"hydration"|"meals"){ if(!snap) return;
    const csv = kind==="schedule"?buildScheduleCSV(plan.schedule):kind==="hydration"?buildHydrationCSV(plan.hydration):buildMealsCSV(plan.meals);
    downloadBlob(new Blob([csv],{type:"text/csv;charset=utf-8"}), `${snap.id}-${kind}.csv`);
  }
  function exportAllZip(){
    if(!snap) return;
    const readme=[
      "GloWell — Export Bundle (Frozen Snapshot)","----------------------------------------",
      `Plan ID: ${snap.id}`,`Version: ${snap.version ?? "—"}`,`Created: ${formatDateTime(snap.createdAt)}`,"",
      "Files included:","• plan.json","• schedule.csv","• hydration.csv","• meals.csv","",
      "Note: This is a read-only export of the stored snapshot.","",
    ].join("\n");
    const files:ZipFile[]=[
      {name:"README.txt",data:textToUint8(readme)},
      {name:"plan.json",data:textToUint8(JSON.stringify(snap,null,2))},
      {name:"schedule.csv",data:textToUint8(buildScheduleCSV(plan.schedule))},
      {name:"hydration.csv",data:textToUint8(buildHydrationCSV(plan.hydration))},
      {name:"meals.csv",data:textToUint8(buildMealsCSV(plan.meals))}
    ];
    try{
      if(ZipUtil){
        if(typeof ZipUtil.ZipBuilder==="function"){const zb=new ZipUtil.ZipBuilder();for(const f of files){if(zb.addText) zb.addText(f.name,new TextDecoder().decode(f.data)); else if(zb.addFile) zb.addFile(f.name,f.data);} const b:Blob=zb.build?.()??zb.finalize?.(); if(b){downloadBlob(b,`${snap.id}.zip`);return;}}
        else if(typeof ZipUtil.buildZip==="function"){downloadBlob(ZipUtil.buildZip(files), `${snap.id}.zip`);return;}
      }
    }catch{}
    downloadBlob(buildZipFallback(files), `${snap.id}.zip`);
  }
  function duplicate(){
    if(!snap?.id) return;
    const t=new Date(); const stamp=`${t.getFullYear()}${String(t.getMonth()+1).padStart(2,"0")}${String(t.getDate()).padStart(2,"0")}-${String(t.getHours()).padStart(2,"0")}${String(t.getMinutes()).padStart(2,"0")}${String(t.getSeconds()).padStart(2,"0")}`;
    const rand=Math.random().toString(16).slice(2,6); const newId=`PLN-${stamp}-${rand}`;
    const copy:Snapshot={...snap,id:newId,createdAt:new Date().toISOString(),legacyIds:[...(snap.legacyIds??[]),snap.id]};
    const next={...plansMap,[newId]:copy}; saveJSON(PLANS_KEY,next); setPlansMap(next);
    const idmap=loadJSON<IdMap>(IDMAP_KEY,{}); idmap[snap.id]=newId; saveJSON(IDMAP_KEY,idmap);
    navigate(`/plans/${newId}`);
  }

  if (notFound && !snap) return (<div className="p-6"><h1 className="text-xl font-semibold mb-2">Plan not found</h1><p className="opacity-80">The requested plan ID could not be located.</p></div>);
  if (!snap) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Plan — {snap.id}</h1>
          <div className="text-sm opacity-80">
            Version: {snap.version ?? "—"} • Saved: {formatDateTime(snap.createdAt)}
          </div>
          {packNames.length ? (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs opacity-80">
                Condition Packs applied: {packNames.join(", ")}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="border rounded px-3 py-1" onClick={printPage}>Print</button>
          <button className="border rounded px-3 py-1" onClick={copyLink}>Copy Link</button>
          <button className="border rounded px-3 py-1" onClick={downloadJSON}>JSON</button>
          <button className="border rounded px-3 py-1" onClick={() => downloadCSV("schedule")}>Schedule CSV</button>
          <button className="border rounded px-3 py-1" onClick={() => downloadCSV("hydration")}>Hydration CSV</button>
          <button className="border rounded px-3 py-1" onClick={() => downloadCSV("meals")}>Meals CSV</button>
          <button className="border rounded px-3 py-1" onClick={exportAllZip}>Export All (ZIP)</button>
          <button className="border rounded px-3 py-1" onClick={duplicate}>Duplicate</button>
        </div>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Metrics</h2>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="opacity-70">BMI</dt><dd>{plan.metrics?.bmi ?? "—"}</dd>
            <dt className="opacity-70">Energy (kcal)</dt><dd>{plan.metrics?.energyEstimateKcal ?? "—"}</dd>
          </dl>
        </div>
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Hydration</h2>
          <div className="text-sm">Daily target: {plan.hydration?.dailyTargetLiters ?? "—"} L</div>
          <ul className="mt-2 list-disc list-inside text-sm">
            {(plan.hydration?.reminders ?? []).map((r,i)=>(<li key={i}>{r?.time ?? "—"} — {r?.note ?? ""}</li>))}
          </ul>
        </div>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Meals</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-1 pr-2">Time</th><th className="py-1 pr-2">Title</th><th className="py-1 pr-2">kcal</th><th className="py-1 pr-2">Notes</th></tr></thead>
            <tbody>{(plan.meals ?? []).map((m,idx)=>(
              <tr key={idx} className="border-b last:border-b-0">
                <td className="py-1 pr-2">{m.time ?? "—"}</td><td className="py-1 pr-2">{m.title ?? "—"}</td><td className="py-1 pr-2">{m.kcal ?? "—"}</td><td className="py-1 pr-2">{m.notes ?? ""}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Schedule</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-1 pr-2">Time</th><th className="py-1 pr-2">Title</th><th className="py-1 pr-2">Type</th><th className="py-1 pr-2">Notes</th></tr></thead>
            <tbody>{(plan.schedule ?? []).map((s,idx)=>(
              <tr key={idx} className="border-b last:border-b-0">
                <td className="py-1 pr-2">{s.time ?? "—"}</td><td className="py-1 pr-2">{s.title ?? "—"}</td><td className="py-1 pr-2">{s.type ?? "—"}</td><td className="py-1 pr-2">{s.notes ?? ""}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-semibold mb-2">Tips</h2>
        <ul className="list-disc list-inside text-sm">
          {(plan.tips ?? []).map((t,i)=>(
            <li key={i}>
              {t.text} <span className="opacity-60">{t.pack ? `(${t.pack})` : t.source ? `(${t.source})` : ""}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
