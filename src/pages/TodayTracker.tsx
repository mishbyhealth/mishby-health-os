// src/pages/TodayTracker.tsx
import { useEffect, useMemo, useState } from 'react';
import { isLocked } from '@/utils/lock';
import { toast } from '@/utils/toast';
import {
  TrackerDay,
  loadDay,
  saveDay,
  recentDays,
  getDaysRange,
  exportDaysCSV,
  exportDaysJSON,
  hydrationGoal
} from '@/services/trackerService';

function getAccountId(): string {
  if (typeof window === 'undefined') return 'local';
  return window.localStorage.getItem('glowell:account:id') || 'local';
}

function todayISO(): string { return new Date().toISOString().slice(0,10); }

export default function TodayTracker() {
  const accountId = getAccountId();
  const [date, setDate] = useState<string>(todayISO());
  const [day, setDay] = useState<TrackerDay>(() => loadDay(accountId, todayISO()) || { date: todayISO(), pulses: [] });

  // derive goal
  const goalMl = useMemo(() => hydrationGoal(day.weightKg, day.heatLevel ?? 1, day.activityLevel ?? 1), [day.weightKg, day.heatLevel, day.activityLevel]);

  useEffect(() => {
    const loaded = loadDay(accountId, date) || { date, pulses: [] };
    setDay(prev => ({ ...loaded, weightKg: loaded.weightKg ?? prev.weightKg, heatLevel: loaded.heatLevel ?? prev.heatLevel, activityLevel: loaded.activityLevel ?? prev.activityLevel }));
  }, [accountId, date]);

  useEffect(() => {
    // autosave with small debounce
    const t = setTimeout(() => saveDay(accountId, day.date, day), 300);
    return () => clearTimeout(t);
  }, [accountId, day]);

  const pct = Math.min(100, Math.round(((day.hydrationMl || 0) / (goalMl || 1)) * 100));

  const addPulse = (ml: number) => {
    if (isLocked()) { try { toast('Maintenance Mode: tracker is read-only.'); } catch {} return; }
    const pulses = Array.isArray(day.pulses) ? [...day.pulses, ml] : [ml];
    const hydrationMl = (day.hydrationMl || 0) + ml;
    setDay({ ...day, pulses, hydrationMl });
  };

  const export14JSON = () => {
    const list = getDaysRange(accountId, date, 14);
    exportDaysJSON(`glowell_tracker_${accountId}_last14`, list);
  };
  const export30CSV = () => {
    const list = getDaysRange(accountId, date, 30);
    exportDaysCSV(`glowell_tracker_${accountId}_last30`, list);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Today Tracker</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={export14JSON} className="border rounded px-2 py-1 text-sm">Export JSON (14d)</button>
          <button onClick={export30CSV} className="border rounded px-2 py-1 text-sm">Export CSV (30d)</button>
        </div>
      </div>

      {/* Hydration */}
      <section className="border rounded p-3 space-y-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-medium">Hydration</h2>
          <span className="text-xs opacity-70">(non-clinical)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs">Weight (kg)</label>
            <input type="number" min={20} max={200}
              value={day.weightKg ?? ''}
              onChange={e => setDay({ ...day, weightKg: Number(e.target.value) || undefined })}
              className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-xs">Heat</label>
            <select
              value={day.heatLevel ?? 1}
              onChange={e => setDay({ ...day, heatLevel: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1"
            >
              <option value={0}>Cool</option>
              <option value={1}>Moderate</option>
              <option value={2}>Hot</option>
            </select>
          </div>
          <div>
            <label className="text-xs">Activity</label>
            <select
              value={day.activityLevel ?? 1}
              onChange={e => setDay({ ...day, activityLevel: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1"
            >
              <option value={0}>Low</option>
              <option value={1}>Medium</option>
              <option value={2}>High</option>
            </select>
          </div>
          <div>
            <label className="text-xs">Goal (ml)</label>
            <input disabled value={goalMl} className="w-full border rounded px-2 py-1 bg-slate-50" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => addPulse(200)} className="border rounded px-2 py-1 text-sm">+200 ml</button>
          <button onClick={() => addPulse(250)} className="border rounded px-2 py-1 text-sm">+250 ml</button>
          <button onClick={() => addPulse(300)} className="border rounded px-2 py-1 text-sm">+300 ml</button>
          <div className="ml-auto text-sm">
            <span className="opacity-70">Today:</span>{' '}
            <strong>{day.hydrationMl || 0} ml</strong>{' '}
            <span className="opacity-70">({pct}% of goal)</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded h-2 overflow-hidden">
          <div className="h-2" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {/* Sleep */}
      <section className="border rounded p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs">Sleep Start</label>
            <input type="time" value={day.sleepStart ?? ''} onChange={e => setDay({ ...day, sleepStart: e.target.value })} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-xs">Sleep End</label>
            <input type="time" value={day.sleepEnd ?? ''} onChange={e => setDay({ ...day, sleepEnd: e.target.value })} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-xs">Sleep Hours</label>
            <input type="number" step="0.1" value={day.sleepHours ?? ''} onChange={e => setDay({ ...day, sleepHours: Number(e.target.value) || undefined })} className="w-full border rounded px-2 py-1" />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="border rounded p-3 space-y-2">
        <label className="text-xs">Notes (free text)</label>
        <textarea value={day.notes ?? ''} onChange={e => setDay({ ...day, notes: e.target.value })} className="w-full border rounded px-2 py-1 h-24" />
      </section>

      {/* Recent chips */}
      <div className="flex flex-wrap gap-2">
        {recentDays().slice(-14).map(d => (
          <button key={d} onClick={() => setDate(d)} className={`px-2 py-1 rounded border text-xs ${d===date ? 'bg-slate-100' : 'bg-white'}`}>{d}</button>
        ))}
      </div>
    </div>
  );
}
