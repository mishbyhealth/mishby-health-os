// src/services/trackerService.ts
import { isLocked } from '@/utils/lock';
import { toast } from '@/utils/toast';

export type TrackerDay = {
  date: string;               // YYYY-MM-DD
  sleepStart?: string;        // "22:30"
  sleepEnd?: string;          // "06:15"
  sleepHours?: number;        // computed or entered
  hydrationMl?: number;       // total ml
  pulses?: number[];          // quick adds (each pulse ml)
  dosha?: { vata?: number; pitta?: number; kapha?: number };
  vitals?: Record<string, number | string>;
  symptoms?: string[];
  notes?: string;
  // optional user context snapshot (lightweight)
  weightKg?: number;
  heatLevel?: number;         // 0=cool,1=moderate,2=hot
  activityLevel?: number;     // 0=low,1=med,2=high
};

const KEY_PREFIX = 'glowell:tracker:';
const RECENT_IDX = 'glowell:tracker:recent-days';

function keyFor(accountId: string, date: string) {
  return `${KEY_PREFIX}${accountId}:${date}`;
}

export function loadDay(accountId: string, date: string): TrackerDay | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(accountId, date));
    return raw ? (JSON.parse(raw) as TrackerDay) : null;
  } catch {
    return null;
  }
}

export function saveDay(accountId: string, date: string, data: TrackerDay): void {
  if (typeof window === 'undefined') return;
  if (isLocked()) {
    try { toast('Maintenance Mode: tracker is read-only.'); } catch {}
    console.warn('[Maintenance] Blocked tracker save for', accountId, date);
    return;
  }
  try {
    // normalize pulses → hydrationMl if both present
    if (Array.isArray(data.pulses)) {
      const sum = data.pulses.reduce((a, b) => a + (Number(b) || 0), 0);
      if (!data.hydrationMl || sum > data.hydrationMl) data.hydrationMl = sum;
    }
    window.localStorage.setItem(keyFor(accountId, date), JSON.stringify(data));
    // maintain recent index
    const raw = window.localStorage.getItem(RECENT_IDX) || '[]';
    const arr = new Set<string>(JSON.parse(raw));
    arr.add(date);
    window.localStorage.setItem(RECENT_IDX, JSON.stringify(Array.from(arr).sort().slice(-60)));
  } catch (e) {
    console.warn('Failed to save tracker day', e);
  }
}

export function recentDays(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_IDX) || '[]';
    return JSON.parse(raw);
  } catch { return []; }
}

// ---------- Goals & inference ----------

export function hydrationGoal(weightKg?: number, heatLevel = 1, activityLevel = 1): number {
  // Base: 30 ml per kg (common wellness heuristic; non-clinical)
  const base = (Number(weightKg) > 0 ? Number(weightKg) : 60) * 30; // fallback 60kg
  // simple modifiers: heat(+0/10/20%), activity(+0/10/20%)
  const heatMult = [1.0, 1.1, 1.2][clamp01to2(heatLevel)];
  const actMult  = [1.0, 1.1, 1.2][clamp01to2(activityLevel)];
  return Math.round(base * heatMult * actMult);
}

export function sleepGoalHours(): number {
  // neutral, general wellness goal band; we take 7.5h as center
  return 7.5;
}

function clamp01to2(n: any): 0|1|2 {
  const x = Number(n);
  if (x <= 0) return 0; if (x >= 2) return 2; return 1 as 1;
}

// ---------- Range & aggregates ----------

export function getDaysRange(accountId: string, endDateISO: string, spanDays: number): TrackerDay[] {
  const days: TrackerDay[] = [];
  const end = new Date(endDateISO + 'T00:00:00');
  for (let i = 0; i < spanDays; i++) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const y = d.toISOString().slice(0,10);
    const item = loadDay(accountId, y);
    if (item) days.push(item);
  }
  return days.reverse();
}

export type AdherenceAgg = {
  days: number;
  hydration: { goalMlAvg: number; actualMlAvg: number; pct: number };
  sleep: { goalHrs: number; actualHrsAvg: number; pct: number };
};

export function aggregateAdherence(accountId: string, endDateISO: string, spanDays: number): AdherenceAgg {
  const list = getDaysRange(accountId, endDateISO, spanDays);
  const days = list.length || 1;
  let actualMl = 0, goalMl = 0, actualHrs = 0;
  for (const d of list) {
    const g = hydrationGoal(d.weightKg, d.heatLevel ?? 1, d.activityLevel ?? 1);
    goalMl += g;
    actualMl += Number(d.hydrationMl) || 0;
    actualHrs += Number(d.sleepHours) || inferSleepHours(d.sleepStart, d.sleepEnd) || 0;
  }
  const goalHrs = sleepGoalHours();
  return {
    days,
    hydration: {
      goalMlAvg: Math.round(goalMl / days),
      actualMlAvg: Math.round(actualMl / days),
      pct: safePct(actualMl, goalMl)
    },
    sleep: {
      goalHrs,
      actualHrsAvg: round1(actualHrs / days),
      pct: safePct(actualHrs, goalHrs * days)
    }
  };
}

function inferSleepHours(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh,sm,eh,em].some(v => Number.isNaN(v))) return null;
  let startMin = sh*60 + sm;
  let endMin = eh*60 + em;
  if (endMin <= startMin) endMin += 24*60; // cross-midnight
  return Math.round(((endMin - startMin) / 60) * 10) / 10;
}

function safePct(n: number, d: number): number {
  if (!d || d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

// ---------- Exports (CSV/JSON) ----------

export function exportDaysJSON(filename: string, days: TrackerDay[]): void {
  const blob = new Blob([JSON.stringify(days, null, 2)], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, sanitize(filename, 'json'));
}

export function exportDaysCSV(filename: string, days: TrackerDay[]): void {
  const header = [
    'date','sleepStart','sleepEnd','sleepHours',
    'hydrationMl','pulses','vata','pitta','kapha',
    'vitals','symptoms','notes','weightKg','heatLevel','activityLevel'
  ];
  const rows = days.map(d => [
    d.date ?? '',
    d.sleepStart ?? '',
    d.sleepEnd ?? '',
    val(d.sleepHours),
    val(d.hydrationMl),
    Array.isArray(d.pulses) ? d.pulses.join('|') : '',
    val(d.dosha?.vata),
    val(d.dosha?.pitta),
    val(d.dosha?.kapha),
    d.vitals ? jsonFlat(d.vitals) : '',
    Array.isArray(d.symptoms) ? d.symptoms.join('|') : '',
    cleanText(d.notes ?? ''),
    val(d.weightKg),
    val(d.heatLevel),
    val(d.activityLevel),
  ]);
  const csv = [header.join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, sanitize(filename, 'csv'));
}

function val(x: any): string { return (x===undefined || x===null) ? '' : String(x); }
function jsonFlat(obj: Record<string, any>): string {
  return Object.entries(obj).map(([k,v]) => `${k}:${v}`).join('|');
}
function cleanText(s: string): string {
  return s.replace(/\r?\n+/g,' ').replace(/,+/g,';').trim();
}
function csvEscape(s: string): string {
  if (s === '') return '';
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
  return s;
}
function sanitize(name: string, ext: 'csv'|'json'): string {
  return `${name.replace(/[^a-z0-9-_]+/gi,'_').slice(0,80)}.${ext}`;
}
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
