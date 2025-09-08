// src/utils/drafts.ts
// Draft Manager (mode + account-aware)
// Keys:
//  user  -> glowell:drafts:user:self:<page>
//  owner -> glowell:drafts:owner:<accountId>:<page>

import { getMode } from "./mode";
import { getCurrentId } from "./accounts";

type Json = unknown;

export function draftKey(page: string): string {
  const mode = getMode();
  if (mode === "owner") {
    const acc = getCurrentId() || "self";
    return `glowell:drafts:owner:${acc}:${page}`;
    }
  return `glowell:drafts:user:self:${page}`;
}

export function saveDraft(page: string, data: Json) {
  try { localStorage.setItem(draftKey(page), JSON.stringify(data)); } catch {}
}

export function loadDraft<T = any>(page: string, fallback: T | null = null): T | null {
  try {
    const raw = localStorage.getItem(draftKey(page));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function clearDraft(page: string) {
  try { localStorage.removeItem(draftKey(page)); } catch {}
}

/* Optional React hook (debounced autosave) */
export function useDraftAutosave<T extends Record<string, any>>(
  React: typeof import("react"),
  page: string,
  state: T,
  delayMs = 600
) {
  const { useEffect, useRef } = React;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // @ts-ignore
    timerRef.current = window.setTimeout(() => { saveDraft(page, state); }, delayMs);
    return () => { if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; } };
  }, [page, state, delayMs]);

  // Re-save on mode/account switch so correct namespace picks up new work
  useEffect(() => {
    const handler = () => saveDraft(page, state);
    window.addEventListener("glowell:modechange", handler as EventListener);
    window.addEventListener("glowell:accountchange", handler as EventListener);
    return () => {
      window.removeEventListener("glowell:modechange", handler as EventListener);
      window.removeEventListener("glowell:accountchange", handler as EventListener);
    };
  }, [page, state]);
}
