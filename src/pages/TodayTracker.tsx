// src/pages/TodayTracker.tsx
import { useEffect, useMemo, useState } from "react";
import {
  TrackerDay, ymd, loadDay, saveDay, listRecentDays,
  computeGoals, sumHydrationMl
} from "@/services/trackerService";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const nowHm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function TodayTracker() {
  const [date, setDate] = useState<string>(ymd());
  const [day, setDay] = useState<TrackerDay>(() => loadDay(ymd()));
  const goals = useMemo(() => computeGoals(), []);
  const recent = useMemo(() => listRecentDays(14), [date]); // refresh when date changes

  // derive hours if start/end provided
  const hours = useMemo(() => {
    const s = day.sleep?.start, e = day.sleep?.end;
    if (!s || !e) return day.sleep?.hours || 0;
    try {
      const [sh, sm] = s.split(":").map(Number);
      const [eh, em] = e.split(":").map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60; // overnight
      return Math.round((mins / 60) * 10) / 10;
    } catch { return day.sleep?.hours || 0; }
  }, [day.sleep?.start, day.sleep?.end, day.sleep?.hours]);

  // adherence
  const hydTotal = useMemo(() => sumHydrationMl(day), [day]);
  const sleepAdh = Math.min(100, Math.round((hours / goals.sleepHours) * 100));
  const hydAdh = Math.min(100, Math.round((hydTotal / goals.hydrationMl) * 100));

  // load a specific date
  function load(dateStr: string) {
    setDate(dateStr);
    setDay(loadDay(dateStr));
  }

  // write-through save
  function commit(next: Partial<TrackerDay>) {
    const updated: TrackerDay = { ...day, ...next, date };
    setDay(updated);
    saveDay(updated);
  }

  // pulse add
  function addPulse(ml: number) {
    const pulses = [...(day.hydration?.pulses || [])];
    pulses.push({ time: nowHm(), ml });
    commit({ hydration: { ml: day.hydration?.ml || 0, pulses } });
  }

  // UI helpers
  const chip = (label: string, ok: boolean) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${ok ? "bg-green-50 border-green-300" : "bg-amber-50 border-amber-300"}`}>{label}</span>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Header />

      <h1 className="text-2xl font-semibold mb-4">Today Tracker</h1>

      {/* Date + Quick history */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => load(e.target.value)}
          className="rounded border px-3 py-1"
        />
        <div className="text-sm opacity-70">Recent:</div>
        <div className="flex flex-wrap gap-2">
          {recent.length === 0 && <span className="text-sm opacity-60">—</span>}
          {recent.map((d) => (
            <button
              key={d}
              onClick={() => load(d)}
              className={`rounded-full border px-3 py-1 text-xs ${d === date ? "bg-black text-white" : "bg-white"}`}
              title="Open this day"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Goals + adherence */}
      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-lg font-medium mb-3">Targets & Adherence</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded border p-3">
            <div className="text-xs opacity-70">Sleep goal</div>
            <div className="text-xl font-semibold">{goals.sleepHours} h</div>
            <div className="mt-2 text-sm">Today: <b>{hours || 0} h</b></div>
            <div className="mt-2 h-2 w-full rounded bg-gray-200">
              <div className="h-2 rounded bg-black" style={{ width: `${sleepAdh}%` }} />
            </div>
            <div className="mt-1 text-xs opacity-70">Adherence: {sleepAdh}%</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs opacity-70">Hydration goal</div>
            <div className="text-xl font-semibold">{goals.hydrationMl} ml</div>
            <div className="mt-2 text-sm">Today: <b>{hydTotal} ml</b></div>
            <div className="mt-2 h-2 w-full rounded bg-gray-200">
              <div className="h-2 rounded bg-black" style={{ width: `${hydAdh}%` }} />
            </div>
            <div className="mt-1 text-xs opacity-70">Adherence: {hydAdh}%</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {chip("Sleep ok if ≥ ~7–8h", hours >= 7)}
          {chip("Hydration ok if near goal", hydTotal >= goals.hydrationMl * 0.8)}
        </div>
      </section>

      {/* Sleep */}
      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-lg font-medium mb-3">Sleep</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2">
            <span className="text-sm opacity-70">Start</span>
            <input type="time" value={day.sleep?.start || ""} onChange={(e)=>commit({ sleep: { ...day.sleep, start: e.target.value } })} className="rounded border px-2 py-1"/>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm opacity-70">End</span>
            <input type="time" value={day.sleep?.end || ""} onChange={(e)=>commit({ sleep: { ...day.sleep, end: e.target.value } })} className="rounded border px-2 py-1"/>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm opacity-70">Hours</span>
            <input type="number" min={0} step={0.25} value={day.sleep?.hours ?? ""} onChange={(e)=>commit({ sleep: { ...day.sleep, hours: Number(e.target.value) || 0 } })} className="w-24 rounded border px-2 py-1"/>
          </label>
        </div>
      </section>

      {/* Hydration */}
      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-lg font-medium mb-3">Hydration</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded border px-3 py-1" onClick={()=>addPulse(150)}>+150 ml</button>
          <button className="rounded border px-3 py-1" onClick={()=>addPulse(250)}>+250 ml</button>
          <button className="rounded border px-3 py-1" onClick={()=>addPulse(300)}>+300 ml</button>
          <label className="ml-3 text-sm opacity-70">Manual total (ml)</label>
          <input
            type="number"
            min={0}
            step={50}
            value={day.hydration?.ml ?? ""}
            onChange={(e)=>commit({ hydration: { ml: Number(e.target.value) || 0, pulses: day.hydration?.pulses || [] } })}
            className="w-28 rounded border px-2 py-1"
          />
        </div>
        <div className="mt-2 text-sm opacity-70">
          Pulses today: {(day.hydration?.pulses || []).length} • Total: <b>{hydTotal} ml</b>
        </div>
      </section>

      {/* Daily Dosha */}
      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-lg font-medium mb-3">Daily Dosha (self-feel)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(["vata","pitta","kapha"] as const).map((k)=> (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-sm capitalize">{k}</span>
              <input type="range" min={0} max={10} value={(day.dosha?.[k] ?? 5)} onChange={(e)=>commit({ dosha: { ...day.dosha, [k]: Number(e.target.value) } as any })}/>
              <span className="text-xs opacity-70">Value: {day.dosha?.[k] ?? 5}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Quick vitals & symptoms */}
      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-lg font-medium mb-3">Quick Vitals & Symptoms</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input placeholder="BP (e.g., 126/82)" value={day.vitals?.bp || ""} onChange={(e)=>commit({ vitals: { ...day.vitals, bp: e.target.value } })} className="rounded border px-3 py-1"/>
          <input placeholder="Sugar (e.g., 108 mg/dL)" value={day.vitals?.sugar || ""} onChange={(e)=>commit({ vitals: { ...day.vitals, sugar: e.target.value } })} className="rounded border px-3 py-1"/>
          <input placeholder="Weight (kg)" type="number" step={0.1} value={day.vitals?.weightKg ?? ""} onChange={(e)=>commit({ vitals: { ...day.vitals, weightKg: Number(e.target.value) || undefined } })} className="w-32 rounded border px-3 py-1"/>
        </div>
        <div className="mt-3">
          <input
            placeholder="Symptoms (comma separated)"
            value={(day.symptoms || []).join(", ")}
            onChange={(e)=>commit({ symptoms: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })}
            className="w-full rounded border px-3 py-1"
          />
        </div>
      </section>

      {/* Notes */}
      <section className="mb-8 rounded-xl border p-4">
        <h2 className="text-lg font-medium mb-3">Notes</h2>
        <textarea
          value={day.notes || ""}
          onChange={(e)=>commit({ notes: e.target.value })}
          rows={4}
          className="w-full rounded border px-3 py-2"
          placeholder="Free notes for today…"
        />
      </section>

      <Footer />
    </div>
  );
}
