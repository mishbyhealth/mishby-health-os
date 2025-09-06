// src/utils/owner.ts
// Owner detection + "Full Form" preview flag with early-boot helpers.
// Aligns with main.tsx expectations: <html data-owner="0|1" data-fullform="0|1">

const KEY_OWNER = "glowell:owner";                 // optional owner gate
const KEY_FULL  = "glowell:owner:full-form";       // show ALL drawers when true

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    // accept "true"/"false" and "1"/"0"
    if (raw === "1") return true;
    if (raw === "0") return false;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function reflectHtmlAttrs() {
  try {
    const html = document.documentElement;
    const owner = readBool(KEY_OWNER, true);
    const full  = readBool(KEY_FULL,  true);
    html.setAttribute("data-owner", owner ? "1" : "0");
    html.setAttribute("data-fullform", full ? "1" : "0"); // <-- matches main.tsx comment
  } catch {
    // ignore SSR / non-DOM
  }
}

function writeBool(key: string, val: boolean) {
  try {
    // store as "true"/"false" for backward-compat; we also read "1"/"0"
    localStorage.setItem(key, String(!!val));
  } catch {
    // ignore
  }
  reflectHtmlAttrs();
}

/** Is this device the Owner? (default true so you aren't locked out during setup) */
export function isOwner(): boolean {
  return readBool(KEY_OWNER, true);
}

/** Explicitly set owner on/off for this device (optional UI elsewhere). */
export function setOwner(val: boolean) {
  writeBool(KEY_OWNER, !!val);
}

/** Current Full Form flag (Owner preview). */
export function getFullForm(): boolean {
  return readBool(KEY_FULL, true);
}

/** Back-compat alias some files may import. */
export function isFullForm(): boolean {
  return getFullForm();
}

/** Set Full Form flag and mirror to <html data-fullform>. */
export function setFullForm(val: boolean) {
  writeBool(KEY_FULL, !!val);
}

/** Toggle Full Form flag. Returns the new value. */
export function toggleFullForm(): boolean {
  const next = !getFullForm();
  setFullForm(next);
  return next;
}

/** 🔧 Boot-time helper expected by main.tsx.
 * Ensures <html data-fullform="0|1"> matches stored value and returns the flag.
 */
export function bootFullFormFromStorage(): boolean {
  const v = getFullForm();
  reflectHtmlAttrs();
  return v;
}

/** 🔧 NEW: Boot helper to read ?owner=1 (and optional ?fullform=1) from URL once.
 * - Accepts 1/0, true/false, yes/no, on/off.
 * - Persists to localStorage and syncs <html data-owner / data-fullform>.
 * - Cleans the URL (removes the params) without reloading.
 * - Returns current owner flag.
 */
export function bootOwnerFromURL(): boolean {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    let changed = false;

    if (params.has("owner")) {
      const raw = (params.get("owner") || "").toLowerCase();
      const val = raw === "1" || raw === "true" || raw === "yes" || raw === "on";
      setOwner(val);
      changed = true;
    }

    if (params.has("fullform")) {
      const raw = (params.get("fullform") || "").toLowerCase();
      const val = raw === "1" || raw === "true" || raw === "yes" || raw === "on";
      setFullForm(val);
      changed = true;
    }

    // Ensure attributes reflect the latest state
    reflectHtmlAttrs();

    // Clean the URL if we consumed any params, without a reload
    if (changed) {
      params.delete("owner");
      params.delete("fullform");
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    // ignore
  }
  return isOwner();
}
