// src/services/trackerService.ts
// Lightweight tracker store + goals + history (localStorage)

type AnyObj = Record<string, any>;
const LS_PREFIX = "glowell:tracker:v1";
const IDX_KEY = (acct: string) => `${LS_PREFIX}:index:${acct}`;
const DAY_KEY = (acct: string, ymd: string) => `${LS_PREFIX}:day:${acct}:${ymd}`;
const SUB_KEY = "glowell:subscription";
const INTAKE_KEY = "glowell:intake";

export type TrackerDay = {
  date: string; // YYYY-MM-DD
  sleep?: { start?: string; end?: string; hours?: number };
  hydration?: { ml?: number; pulses?: Array<{ time: string; ml: number }> };
  dosha?: { vata?: number; pitta?: number; kapha?: number };
  vitals?: { bp?: string; sugar?: string; weightKg?: number };
  symptoms?: string[];
  notes?: string;
};

export function ymd(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function writeJSON(key: string, val: any) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function accountId(): string {
  try {
    const sub = readJSON<any>(SUB_KEY, {});
    // prefer email/name as a simple stable id; fallback to "default"
    return (sub?.email || sub?.name || "default").toString().toLowerCase();
  } catch { return "default"; }
}

export function loadDay(date = ymd()): TrackerDay {
  const acct = accountId();
  return readJSON<TrackerDay>(DAY_KEY(acct, date), { date });
}

export function saveDay(day: TrackerDay) {
  const acct = accountId();
  const key = DAY_KEY(acct, day.date);
  writeJSON(key, day);

  // maintain index (most-recent-first unique)
  const idxKey = IDX_KEY(acct);
  const idx = readJSON<string[]>(idxKey, []);
  const set = new Set([day.date, ...idx]);
  const next = Array.from(set).sort((a, b) => (a > b ? -1 : 1)).slice(0, 60);
  writeJSON(idxKey, next);
}

export function listRecentDays(limit = 14): string[] {
  const acct = accountId();
  const idx = readJSON<string[]>(IDX_KEY(acct), []);
  return idx.slice(0, limit);
}

// ----- Goals (simple, non-clinical) -----
export type Goals = { sleepHours: number; hydrationMl: number };

export function computeGoals(): Goals {
  // Defaults
  let sleepHours = 7.5;
  let hydrationMl = 2000;

  // If intake has weight, set hydration ≈ weightKg * 30 ml (rounded to nearest 100)
  try {
    const intake = readJSON<AnyObj>(INTAKE_KEY, {});
    const w = Number(intake?.weightKg || 0);
    if (w > 0) {
      const ml = Math.round((w * 30) / 100) * 100;
      if (ml >= 1200 && ml <= 4000) hydrationMl = ml;
    }
  } catch {}

  return { sleepHours, hydrationMl };
}

// Helpers
export function sumHydrationMl(day: TrackerDay): number {
  const pulses = day.hydration?.pulses || [];
  const ml = Number(day.hydration?.ml || 0);
  const fromPulses = pulses.reduce((s, p) => s + (Number(p.ml) || 0), 0);
  return ml + fromPulses;
}
