// src/utils/formPersistence.ts  (load/save + useAutosave for V2)
import * as React from "react";

type Json = any;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return (v === null || v === undefined) ? fallback : (v as T);
  } catch { return fallback; }
}

export function loadDraft<T = Json>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return safeParse<T>(raw, fallback);
  } catch { return fallback; }
}

export function saveDraft<T = Json>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function clearDraft(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

export function useAutosave<T = Json>(key: string, value: T, delayMs = 600) {
  React.useEffect(() => {
    const t = setTimeout(() => { saveDraft(key, value); }, Math.max(0, delayMs));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);
}

export function onDraftChange(key: string, cb: (v: Json) => void): () => void {
  const handler = (e: StorageEvent) => { if (e.key === key) cb(safeParse(e.newValue, null)); };
  try { window.addEventListener("storage", handler); } catch {}
  return () => { try { window.removeEventListener("storage", handler); } catch {} };
}
