// src/utils/packs.ts
/**
 * GloWell — Safe packs loader
 * - Tries to fetch known condition packs from /data/packs/*.json
 * - Never throws, never blocks rendering
 * - Memoizes on window.__GLOWWELL_PACKS__ (typed) and provides a synchronous getter
 */

export type PacksMap = Record<string, unknown>;
export type PacksResult = {
  ok: boolean;
  loaded: string[]; // e.g., ["hypertension","diabetes"]
  data: PacksMap;
  error?: string;
};

declare global {
  interface Window {
    __GLOWWELL_PACKS__?: PacksResult;
  }
}

/** Default empty state (used until/if packs load). */
function emptyResult(msg?: string): PacksResult {
  return {
    ok: false,
    loaded: [],
    data: {},
    ...(msg ? { error: msg } : {}),
  };
}

async function loadJSON(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) return null;
    // Guard bad JSON without throwing
    try {
      return await res.json();
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Safe loader for condition packs:
 * - Tries: /data/packs/hypertension.json, /data/packs/diabetes.json (can add more later)
 * - Never throws; returns ok=false on failure.
 * - Memoizes result on window to avoid duplicate fetches.
 */
export async function ensurePacksLoaded(): Promise<PacksResult> {
  if (typeof window !== "undefined" && window.__GLOWWELL_PACKS__) {
    return window.__GLOWWELL_PACKS__!;
  }

  const CANDIDATES = ["hypertension", "diabetes"]; // add more slugs here when available
  const data: PacksMap = {};
  const loaded: string[] = [];

  // Load in sequence (keeps it simple; volume is tiny)
  for (const slug of CANDIDATES) {
    const json = await loadJSON(`/data/packs/${slug}.json`);
    if (json) {
      data[slug] = json;
      loaded.push(slug);
    }
  }

  const result: PacksResult =
    loaded.length > 0
      ? { ok: true, loaded, data }
      : emptyResult(
          "No packs found at /data/packs/*.json (this is fine; app will continue without pack tips)."
        );

  if (typeof window !== "undefined") {
    window.__GLOWWELL_PACKS__ = result;
  }
  if (!result.ok && result.error) {
    // Warn only once
    if (!(typeof window !== "undefined" && (window as any).__GW_PACKS_WARNED__) ) {
      console.warn(result.error);
      (window as any).__GW_PACKS_WARNED__ = true;
    }
  }
  return result;
}

/**
 * Synchronous snapshot for render-time safety.
 * Use in components if you need to read without awaiting:
 *   const packs = getPacksResult();
 */
export function getPacksResult(): PacksResult {
  if (typeof window !== "undefined" && window.__GLOWWELL_PACKS__) {
    return window.__GLOWWELL_PACKS__!;
  }
  return emptyResult();
}

/** Convenience helper */
export function isPacksReady(): boolean {
  return getPacksResult().ok;
}
