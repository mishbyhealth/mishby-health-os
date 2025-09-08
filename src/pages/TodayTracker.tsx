import React from "react";
import { useAccountId } from "@/context/AccountProvider";
import { useAutosave } from "@/utils/formPersistence";

/**
 * Today Tracker (additive)
 * Stores per-account, per-day logs in localStorage.
 * Keys:
 *  - glowell:tracker:<accountId>:<yyyy-mm-dd>
 *  - glowell:tracker:index:<accountId>   // list of days with any data
 */

type TimeHHMM = string;

type Dosha = { vata?: number; pitta?: number; kapha?: number; label?: string };
type Vitals = {
  bpSys?: number; bpDia?: number; pulse?: number;
  fpg?: number; ppg?: number;
  weightKg?: number;
};
type TrackerDay = {
  dateISO: string;               // yyyy-mm-dd
  sleep?: { sleepTime?: TimeHHMM; wakeTime?: TimeHHMM; hours?: number };
  hydration?: { ml?: number };
  dosha?: Dosha;
  vitals?: Vitals;
  symptoms?: string[];
  notes?: string;
};

const SYMPTOMS = [
  "headache","acidity","gas","bloating","constipation","diarrhea",
  "cough","cold","sore_throat","fatigue","stress","poor_sleep","body_ache"
] as const;

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function shiftISO(base: string, deltaDays: number) {
  const [y,m,d] = base.split("-").map(n=>Number(n));
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate()+deltaDays);
  const mm = String(dt.getMonth()+1).padStart(2,"0");
  const dd = String(dt.getDate()).padStart(2,"0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}
function parseHHMM(t?: string) {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { h, mm };
}
function hoursBetween(sleep?: string, wake?: string): number | undefined {
  const s = parseHHMM(sleep), w = parseHHMM(wake);
  if (!s || !w) return undefined;
  const start = s.h * 60 + s.mm;
  const end = w.h * 60 + w.mm;
  const mins = end >= start ? (end - start) : (24 * 60 - start + end);
  return Math.round((mins / 60) * 10) / 10;
}

export default function TodayTracker() {
  const accountId = useAccountId();

  const [dateISO, setDateISO] = React.useState<string>(todayISO());
  const STORAGE_KEY = `glowell:tracker:${accountId}:${dateISO}`;
  const INDEX_KEY = `glowell:tracker:index:${accountId}`;

  const loadDay = React.useCallback((): TrackerDay => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { dateISO };
  }, [STORAGE_KEY, dateISO]);

  const [day, setDay] = React.useState<TrackerDay>(() => loadDay());
  React.useEffect(() => { setDay(loadDay()); }, [loadDay]);

  // derive sleep hours
  React.useEffect(() => {
    const h = hoursBetween(day.sleep?.sleepTime, day.sleep?.wakeTime);
    setDay(prev => ({ ...prev, sleep: { ...(prev.sleep||{}), hours: h } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.sleep?.sleepTime, day.sleep?.wakeTime]);

  // autosave this day
  useAutosave(STORAGE_KEY, day, 400);

  // maintain index of days with logs
  React.useEffect(() => {
    try {
      const idx = new Set<string>(JSON.parse(localStorage.getItem(INDEX_KEY) || "[]"));
      idx.add(dateISO);
      localStorage.setItem(INDEX_KEY, JSON.stringify([...idx].sort()));
    } catch {}
  }, [INDEX_KEY, dateISO, day]);

  const changeDate = (dir: -1 | 1) => setDateISO(prev => shiftISO(prev, dir));

  const setSleep = (patch: Partial<NonNullable<TrackerDay["sleep"]>>) =>
    setDay(d => ({ ...d, sleep: { ...(d.sleep||{}), ...patch } }));

  const addWater = (ml: number) =>
    setDay(d => ({ ...d, hydration: { ml: Math.max(0, (d.hydration?.ml || 0) + ml) } }));

  const setDosha = (patch: Partial<Dosha>) =>
    setDay(d => ({ ...d, dosha: { ...(d.dosha||{}), ...patch } }));

  const setVitals = (k: keyof Vitals, v?: number) =>
    setDay(d => ({ ...d, vitals: { ...(d.vitals||{}), [k]: v } }));

  const toggleSymptom = (s: string) =>
    setDay(d => {
      const list = d.symptoms || [];
      const has = list.includes(s);
      const next = has ? list.filter(x=>x!==s) : [...list, s];
      return { ...d, symptoms: next };
    });

  return (
    <div className="py-2">
      <div className="gw-tint mx-auto" style={{ maxWidth: 980, padding: "0.75rem 1rem" }}>
        <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="text-xl">Today Tracker</h2>
          <div className="gw-row" style={{ gap: 8 }}>
            <button className="gw-btn" onClick={() => changeDate(-1)}>← Prev</button>
            <input
              className="gw-input"
              type="date"
              value={dateISO}
              onChange={e => setDateISO(e.target.value || todayISO())}
            />
            <button className="gw-btn" onClick={() => setDateISO(todayISO())}>Today</button>
            <button className="gw-btn" onClick={() => changeDate(1)}>Next →</button>
          </div>
        </div>

        {/* Sleep */}
        <section className="gw-card" style={{ marginTop: 12 }}>
          <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3>Sleep</h3>
          </div>
          <div className="gw-row" style={{ gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <label className="gw-row" style={{ gap: 8, alignItems: "center" }}>
              <div className="gw-label" style={{ width: 120 }}>Sleep time</div>
              <input className="gw-input" type="time" value={day.sleep?.sleepTime || ""} onChange={e=>setSleep({ sleepTime: e.target.value })}/>
            </label>
            <label className="gw-row" style={{ gap: 8, alignItems: "center" }}>
              <div className="gw-label" style={{ width: 120 }}>Wake time</div>
              <input className="gw-input" type="time" value={day.sleep?.wakeTime || ""} onChange={e=>setSleep({ wakeTime: e.target.value })}/>
            </label>
            <label className="gw-row" style={{ gap: 8, alignItems: "center" }}>
              <div className="gw-label" style={{ width: 120 }}>Hours</div>
              <input className="gw-input" readOnly value={day.sleep?.hours ?? ""}/>
            </label>
          </div>
        </section>

        {/* Hydration */}
        <section className="gw-card" style={{ marginTop: 12 }}>
          <div className="gw-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3>Hydration</h3>
            <div className="gw-badge">{(day.hydration?.ml || 0)} ml</div>
          </div>
          <div className="gw-row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {[200,250,300,500].map(q => (
              <button key={q} className="gw-btn" onClick={() => addWater(q)}>+{q} ml</button>
            ))}
            {(day.hydration?.ml || 0) > 0 && (
              <button className="gw-btn" onClick={() => addWater(-250)}>–250 ml</button>
            )}
          </div>
        </section>

        {/* Dosha (daily) */}
        <section className="gw-card" style={{ marginTop: 12 }}>
          <h3>Dosha (today)</h3>
          <div className="gw-row" style={{ gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <label className="gw-row" style={{ gap: 8, alignItems: "center" }}>
              <div className="gw-label" style={{ width: 80 }}>Vata</div>
              <input className="gw-input" type="range" min={0} max={10} step={1}
                     value={day.dosha?.vata ?? 0}
                     onChange={e=>setDosha({ vata: Number(e.target.value) })}/>
            </label>
            <label className="gw-row" style={{ gap: 8, alignItems: "center" }}>
              <div className="gw-label" style={{ width: 80 }}>Pitta</div>
              <input className="gw-input" type="range" min={0} max={10} step={1}
                     value={day.dosha?.pitta ?? 0}
                     onChange={e=>setDosha({ pitta: Number(e.target.value) })}/>
            </label>
            <label className="gw-row" style={{ gap: 8, alignItems: "center" }}>
              <div className="gw-label" style={{ width: 80 }}>Kapha</div>
              <input className="gw-input" type="range" min={0} max={10} step={1}
                     value={day.dosha?.kapha ?? 0}
                     onChange={e=>setDosha({ kapha: Number(e.target.value) })}/>
            </label>
          </div>
        </section>

        {/* Quick vitals */}
        <section className="gw-card" style={{ marginTop: 12 }}>
          <h3>Quick Vitals</h3>
          <div className="gw-row" style={{ gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <LabeledNumber label="BP Sys" value={day.vitals?.bpSys} onChange={v=>setVitals("bpSys", v)} />
            <LabeledNumber label="BP Dia" value={day.vitals?.bpDia} onChange={v=>setVitals("bpDia", v)} />
            <LabeledNumber label="Pulse" value={day.vitals?.pulse} onChange={v=>setVitals("pulse", v)} />
            <LabeledNumber label="FPG" value={day.vitals?.fpg} onChange={v=>setVitals("fpg", v)} />
            <LabeledNumber label="PPG" value={day.vitals?.ppg} onChange={v=>setVitals("ppg", v)} />
            <LabeledNumber label="Weight (kg)" value={day.vitals?.weightKg} onChange={v=>setVitals("weightKg", v)} />
          </div>
        </section>

        {/* Symptoms */}
        <section className="gw-card" style={{ marginTop: 12 }}>
          <h3>Symptoms (tap to toggle)</h3>
          <div className="gw-row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {SYMPTOMS.map(s => (
              <button
                key={s}
                className={`gw-badge ${day.symptoms?.includes(s) ? "is-active" : ""}`}
                onClick={() => toggleSymptom(s)}
              >
                {s.replaceAll("_"," ").replace(/\b\w/g, m=>m.toUpperCase())}
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="gw-card" style={{ marginTop: 12 }}>
          <h3>Notes</h3>
          <textarea className="gw-input" rows={4}
            placeholder="Free notes for today..."
            value={day.notes || ""}
            onChange={e => setDay(d => ({ ...d, notes: e.target.value }))}/>
        </section>
      </div>
    </div>
  );
}

function LabeledNumber({ label, value, onChange }:{
  label: string; value?: number; onChange:(v?:number)=>void;
}) {
  return (
    <label className="gw-row" style={{ gap: 8, alignItems: "center" }}>
      <div className="gw-label" style={{ width: 110 }}>{label}</div>
      <input
        className="gw-input"
        inputMode="numeric"
        value={value ?? ""}
        onChange={e => onChange(e.target.value===""?undefined:Number(e.target.value))}
        placeholder="—"
      />
    </label>
  );
}
