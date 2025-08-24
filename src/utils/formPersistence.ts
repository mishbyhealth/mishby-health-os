// src/utils/formPersistence.ts
// Lightweight, dependency-free localStorage helpers for saving/restoring form drafts.
// Safe to use in SSR/Node because it guards for "window" existence.

export const HEALTH_FORM_DRAFT_KEY = "mho:form:healthForm:v1";

type Json =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

/** Returns true if we're in a browser environment. */
function hasWindow() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/** Save any serializable object as a draft. Overwrites previous value. */
export function saveDraft<T extends Json>(
  data: T,
  key: string = HEALTH_FORM_DRAFT_KEY
): void {
  if (!hasWindow()) return;
  try {
    const payload = JSON.stringify({
      v: 1,
      t: Date.now(),
      data,
    });
    window.localStorage.setItem(key, payload);
  } catch {
    // ignore quota/serialization errors silently for UX
  }
}

/** Load a previously saved draft. Returns undefined if none or parse error. */
export function loadDraft<T = any>(
  key: string = HEALTH_FORM_DRAFT_KEY
): T | undefined {
  if (!hasWindow()) return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Basic shape check
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return (parsed as { data: T }).data;
    }
  } catch {
    // fall through
  }
  return undefined;
}

/** Remove the saved draft. No error if it doesn't exist. */
export function clearDraft(key: string = HEALTH_FORM_DRAFT_KEY): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Optional helper: debounce a function without extra libs. */
export function debounce<F extends (...args: any[]) => void>(fn: F, ms = 400) {
  let timer: number | undefined;
  return (...args: Parameters<F>) => {
    if (typeof window === "undefined") return fn(...args);
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}

/* ------------------------------------------------------------------ */
/* Compatibility aliases (expected by HealthForm.tsx)                  */
/* ------------------------------------------------------------------ */
export const saveFormState = saveDraft;
export const loadFormState = loadDraft;
export const clearFormState = clearDraft;
