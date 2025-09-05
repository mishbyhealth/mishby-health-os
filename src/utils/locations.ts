// src/utils/locations.ts
// INDIA LOCATIONS (scalable loader: monolithic or sharded-by-state)
// - If present, uses a MANIFEST at /data/india_locations.manifest.json to lazy-load per-state files.
// - Else tries monolithic /data/india_locations.json (all records).
// - Else falls back to a tiny builtin sample, but UI still works with type-to-search.

export type LocationRecord = {
  state: string;
  district?: string;
  city?: string;     // city/town/village name
  pincode?: string;
};

export type LocationsIndex = {
  // When using manifest, byState may be filled lazily per state
  byState: Map<string, LocationRecord[]>;
  states: string[];
  // internal
  _manifest?: Record<string, string>; // state -> path
  _loadedStates?: Set<string>;
};

export type LocationsResult = {
  ok: boolean;
  loadedCount: number;
  index: LocationsIndex;
  source: "manifest" | "monolithic" | "builtin";
};

let cached: LocationsResult | null = null;

const BUILTIN_SAMPLE: LocationRecord[] = [
  { state: "Gujarat", district: "Ahmedabad", city: "Ahmedabad", pincode: "380001" },
  { state: "Gujarat", district: "Surat", city: "Surat", pincode: "395003" },
  { state: "Maharashtra", district: "Mumbai Suburban", city: "Mumbai", pincode: "400001" },
  { state: "Maharashtra", district: "Pune", city: "Pune", pincode: "411001" },
  { state: "Delhi (NCT)", district: "New Delhi", city: "New Delhi", pincode: "110001" },
  { state: "Karnataka", district: "Bengaluru Urban", city: "Bengaluru", pincode: "560001" },
  { state: "Uttar Pradesh", district: "Varanasi", city: "Varanasi", pincode: "221001" },
];

async function tryFetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function buildIndex(list: LocationRecord[], manifest?: Record<string, string>): LocationsIndex {
  const byState = new Map<string, LocationRecord[]>();
  for (const r of list) {
    const st = r.state?.trim() || "Unknown";
    if (!byState.has(st)) byState.set(st, []);
    byState.get(st)!.push(r);
  }
  const states =
    manifest ? Object.keys(manifest).sort((a, b) => a.localeCompare(b))
             : Array.from(byState.keys()).sort((a, b) => a.localeCompare(b));

  // Sort each state's cities (for non-manifest/monolithic case)
  if (!manifest) {
    for (const st of states) {
      byState.get(st)?.sort((a, b) => (a.city || "").localeCompare(b.city || ""));
    }
  }

  return { byState, states, _manifest: manifest ?? undefined, _loadedStates: new Set() };
}

export async function ensureLocationsLoaded(): Promise<LocationsResult> {
  if (cached) return cached;

  // 1) Manifest path (preferred for full India coverage)
  const manifest = await tryFetchJSON<Record<string, string>>("/data/india_locations.manifest.json");
  if (manifest && Object.keys(manifest).length) {
    // Load no city data yet; lazy per-state
    const idx = buildIndex([], manifest);
    cached = { ok: true, loadedCount: 0, index: idx, source: "manifest" };
    return cached;
  }

  // 2) Monolithic full list
  const mono = await tryFetchJSON<LocationRecord[]>("/data/india_locations.json");
  if (mono && mono.length) {
    const idx = buildIndex(mono);
    cached = { ok: true, loadedCount: mono.length, index: idx, source: "monolithic" };
    return cached;
  }

  // 3) Builtin sample fallback
  const idx = buildIndex(BUILTIN_SAMPLE);
  cached = { ok: false, loadedCount: BUILTIN_SAMPLE.length, index: idx, source: "builtin" };
  return cached;
}

export function searchStates(index: LocationsIndex, q: string): string[] {
  if (!q) return index.states;
  const s = q.toLowerCase();
  return index.states.filter((st) => st.toLowerCase().includes(s));
}

/** Lazy-load city list for a state (when manifest mode). */
export async function ensureStateLoaded(index: LocationsIndex, state: string): Promise<void> {
  if (!state) return;
  if (!index._manifest) return; // not in manifest mode
  const loadedSet = index._loadedStates!;
  if (loadedSet.has(state)) return;

  const path = index._manifest[state];
  if (!path) return;

  const arr = await tryFetchJSON<LocationRecord[]>(path);
  if (arr && arr.length) {
    // Merge into map
    const existing = index.byState.get(state) || [];
    const merged = existing.concat(arr);
    merged.sort((a, b) => (a.city || "").localeCompare(b.city || ""));
    index.byState.set(state, merged);
    loadedSet.add(state);
    if (cached) {
      cached.loadedCount += arr.length;
    }
  }
}

/** Synchronous search (returns currently loaded subset). */
export function searchCities(index: LocationsIndex, state: string, q: string): LocationRecord[] {
  if (!state) return [];
  const list = index.byState.get(state) || [];
  if (!q) return list;
  const s = q.toLowerCase();
  return list.filter(
    (r) =>
      (r.city || "").toLowerCase().includes(s) ||
      (r.district || "").toLowerCase().includes(s) ||
      (r.pincode || "").includes(q)
  );
}

/** Asynchronous search that ensures a state's data is loaded in manifest mode. */
export async function searchCitiesAsync(index: LocationsIndex, state: string, q: string): Promise<LocationRecord[]> {
  if (!state) return [];
  await ensureStateLoaded(index, state);
  return searchCities(index, state, q);
}

/*
Mukul — to enable FULL India coverage (towns & villages) with small, easy files:

A) SHARDED (recommended)
   Place these in /public:
   1. /data/india_locations.manifest.json
      Example:
      {
        "Andhra Pradesh": "/data/locations/Andhra_Pradesh.json",
        "Delhi (NCT)": "/data/locations/Delhi_NCT.json",
        "Gujarat": "/data/locations/Gujarat.json",
        "Maharashtra": "/data/locations/Maharashtra.json"
        // ... add all states & UTs
      }

   2. One file per state under /data/locations/*.json
      Each file is an array of {state, district, city, pincode}.
      Example row:
      {"state":"Gujarat","district":"Ahmedabad","city":"Vatva","pincode":"382440"}

B) MONOLITHIC (single file)
   Put the entire list at /data/india_locations.json as an array of the same shape.

If you want, send me the dataset (or ask me to ingest "India_Locations_Full.zip"), and I'll wire it in.
*/
