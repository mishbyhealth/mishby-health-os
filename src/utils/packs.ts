// src/utils/packs.ts
export type PacksMap = Record<string, unknown>;
export type PacksResult = {
  ok: boolean;
  loaded: string[]; // e.g., ["hypertension","diabetes"]
  data: PacksMap;
  error?: string;
};

async function loadJSON(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Safe loader for condition packs:
 * - Tries: /data/packs/hypertension.json, /data/packs/diabetes.json
 * - Never throws; returns ok=false on failure.
 * - Memoizes result on window to avoid duplicate fetches.
 */
export async function ensurePacksLoaded(): Promise<PacksResult> {
  // @ts-expect-error: attach memo on window
  if (typeof window !== "undefined" && window.__GLOWELL_PACKS__) {
    // @ts-expect-error
    return window.__GLOWELL_PACKS__;
  }

  const data: PacksMap = {};
  const loaded: string[] = [];
  let hadAny = false;

  const hypertension = await loadJSON("/data/packs/hypertension.json");
  if (hypertension) {
    data["hypertension"] = hypertension;
    loaded.push("hypertension");
    hadAny = true;
  }

  const diabetes = await loadJSON("/data/packs/diabetes.json");
  if (diabetes) {
    data["diabetes"] = diabetes;
    loaded.push("diabetes");
    hadAny = true;
  }

  const result: PacksResult = hadAny
    ? { ok: true, loaded, data }
    : {
        ok: false,
        loaded: [],
        data: {},
        error:
          "No packs found at /data/packs/*.json (this is fine; app will continue without pack tips).",
      };

  // @ts-expect-error: save memo on window
  if (typeof window !== "undefined") window.__GLOWELL_PACKS__ = result;
  if (!result.ok) {
    console.warn(result.error);
  }
  return result;
}
