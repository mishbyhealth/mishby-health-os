// src/services/planCache.ts
// Local cache + provenance log (owner-only viewer in UI)

export type ProvEntry = {
  ts: number;            // epoch ms
  hash: string;          // req hash
  source: 'AI' | 'Cache(AI)' | 'Template' | 'Error';
  note?: string;
};

const CACHE_NS = 'glowell:plan:cache:';   // + hash
const PROV_KEY = 'glowell:plan:provenance'; // JSON array (max 100)

export function stableStringify(obj: any): string {
  return JSON.stringify(sortRec(obj));
}
function sortRec(v: any): any {
  if (Array.isArray(v)) return v.map(sortRec);
  if (v && typeof v === 'object') {
    return Object.keys(v).sort().reduce((o, k) => (o[k] = sortRec(v[k]), o), {} as any);
  }
  return v;
}

export function hashString(s: string): string {
  // djb2 -> hex
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  let x = (h >>> 0).toString(16);
  return x.padStart(8, '0');
}

export function cacheGet<T=any>(hash: string, maxAgeMs: number): { ts: number, data: T } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_NS + hash);
    if (!raw) return null;
    const obj = JSON.parse(raw) as { ts: number, data: T };
    if (Date.now() - obj.ts > maxAgeMs) return null;
    return obj;
  } catch { return null; }
}

export function cachePut<T=any>(hash: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    const obj = { ts: Date.now(), data };
    window.localStorage.setItem(CACHE_NS + hash, JSON.stringify(obj));
  } catch {}
}

export function provAdd(e: ProvEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const arr: ProvEntry[] = JSON.parse(window.localStorage.getItem(PROV_KEY) || '[]');
    arr.push(e);
    while (arr.length > 100) arr.shift();
    window.localStorage.setItem(PROV_KEY, JSON.stringify(arr));
  } catch {}
}

export function provList(): ProvEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(PROV_KEY) || '[]'); } catch { return []; }
}

export function provClear(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(PROV_KEY); } catch {}
}

export function isOwnerUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('glowell:owner:unlocked') === '1';
}
